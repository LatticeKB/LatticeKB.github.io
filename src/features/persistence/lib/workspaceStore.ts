import { normalizeCorpus } from '../../corpus/lib/normalizeCorpus';
import { validateCorpus } from '../../corpus/lib/validators';
import type { CorpusEntry, CorpusFile, CorpusOwner } from '../../corpus/model/types';
import { extractSearchableEntry } from '../../search/lib/extractSearchText';
import type { SearchableEntry } from '../../search/model/searchTypes';
import { logAction, logInfo } from '../../../shared/lib/clientLogger';
import type { CorpusSyncState } from '../../../pages/workspace/model/corpusSync';
import {
  openLatticeDatabase,
  WORKSPACE_ENTRY_STORE_NAME,
  WORKSPACE_META_STORE_NAME,
  WORKSPACE_SEARCH_STORE_NAME,
} from './browserDatabase';

const ACTIVE_WORKSPACE_META_KEY = 'active-workspace-meta';

type PersistedWorkspaceMeta = {
  owner: CorpusOwner;
  entryIds: string[];
  corpusName: string;
  selectedEntryId: string | null;
  corpusSyncState: CorpusSyncState;
};

export type PersistedWorkspaceState = {
  owner: CorpusOwner;
  entryIds: string[];
  entriesById: Record<string, CorpusEntry>;
  searchDocsById: Record<string, SearchableEntry>;
  corpusName: string;
  selectedEntryId: string | null;
  corpusSyncState: CorpusSyncState;
};

function isWorkspaceMeta(candidate: unknown): candidate is PersistedWorkspaceMeta {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }

  const value = candidate as Partial<PersistedWorkspaceMeta>;
  return typeof value.corpusName === 'string'
    && Array.isArray(value.entryIds)
    && value.entryIds.every((entryId) => typeof entryId === 'string')
    && (typeof value.selectedEntryId === 'string' || value.selectedEntryId === null)
    && typeof value.corpusSyncState === 'object'
    && value.corpusSyncState !== null
    && typeof value.corpusSyncState.baselineSnapshot === 'string'
    && typeof value.corpusSyncState.baselineName === 'string'
    && (value.corpusSyncState.origin === 'sample' || value.corpusSyncState.origin === 'file' || value.corpusSyncState.origin === 'download')
    && typeof value.owner === 'object'
    && value.owner !== null;
}

export function createWorkspaceState(input: {
  corpus: CorpusFile;
  corpusName: string;
  selectedEntryId: string | null;
  corpusSyncState: CorpusSyncState;
}): PersistedWorkspaceState {
  const normalizedCorpus = normalizeCorpus(validateCorpus(input.corpus));
  const entriesById = Object.fromEntries(normalizedCorpus.entries.map((entry) => [entry.id, entry]));
  const searchDocsById = Object.fromEntries(normalizedCorpus.entries.map((entry) => [entry.id, extractSearchableEntry(entry)]));

  return {
    owner: normalizedCorpus.owner,
    entryIds: normalizedCorpus.entries.map((entry) => entry.id),
    entriesById,
    searchDocsById,
    corpusName: input.corpusName,
    selectedEntryId: input.selectedEntryId,
    corpusSyncState: input.corpusSyncState,
  };
}

export function materializeCorpus(state: Pick<PersistedWorkspaceState, 'owner' | 'entryIds' | 'entriesById'>): CorpusFile {
  return {
    version: '1.1',
    owner: state.owner,
    entries: state.entryIds.map((entryId) => state.entriesById[entryId]).filter((entry): entry is CorpusEntry => Boolean(entry)),
  };
}

function collectChangedEntryIds(previous: PersistedWorkspaceState | null, next: PersistedWorkspaceState) {
  if (!previous) {
    return next.entryIds;
  }

  const changedEntryIds = new Set<string>();
  next.entryIds.forEach((entryId) => {
    if (previous.entriesById[entryId] !== next.entriesById[entryId] || previous.searchDocsById[entryId] !== next.searchDocsById[entryId]) {
      changedEntryIds.add(entryId);
    }
  });

  return [...changedEntryIds];
}

function collectRemovedEntryIds(previous: PersistedWorkspaceState | null, next: PersistedWorkspaceState) {
  if (!previous) {
    return [];
  }

  const nextEntryIds = new Set(next.entryIds);
  return previous.entryIds.filter((entryId) => !nextEntryIds.has(entryId));
}

function shouldReplaceWorkspace(previous: PersistedWorkspaceState | null, next: PersistedWorkspaceState) {
  if (!previous) {
    return true;
  }

  const removedEntryIds = collectRemovedEntryIds(previous, next).length;
  const changedEntryIds = collectChangedEntryIds(previous, next).length;
  return removedEntryIds + changedEntryIds > Math.max(25, next.entryIds.length / 3);
}

async function replaceWorkspaceState(next: PersistedWorkspaceState) {
  const database = await openLatticeDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      [WORKSPACE_META_STORE_NAME, WORKSPACE_ENTRY_STORE_NAME, WORKSPACE_SEARCH_STORE_NAME],
      'readwrite',
    );
    const metaStore = transaction.objectStore(WORKSPACE_META_STORE_NAME);
    const entryStore = transaction.objectStore(WORKSPACE_ENTRY_STORE_NAME);
    const searchStore = transaction.objectStore(WORKSPACE_SEARCH_STORE_NAME);

    metaStore.put({
      owner: next.owner,
      entryIds: next.entryIds,
      corpusName: next.corpusName,
      selectedEntryId: next.selectedEntryId,
      corpusSyncState: next.corpusSyncState,
    } satisfies PersistedWorkspaceMeta, ACTIVE_WORKSPACE_META_KEY);

    entryStore.clear();
    searchStore.clear();

    next.entryIds.forEach((entryId) => {
      const entry = next.entriesById[entryId];
      const searchDoc = next.searchDocsById[entryId] ?? extractSearchableEntry(entry);
      entryStore.put(entry, entryId);
      searchStore.put(searchDoc, entryId);
    });

    transaction.oncomplete = () => {
      logInfo('workspace.persistence.replace_completed', {
        corpusName: next.corpusName,
        entryCount: next.entryIds.length,
      });
      resolve();
    };
    transaction.onerror = () => reject(new Error('Unable to save active workspace.'));
  });
}

async function patchWorkspaceState(previous: PersistedWorkspaceState, next: PersistedWorkspaceState) {
  const changedEntryIds = collectChangedEntryIds(previous, next);
  const removedEntryIds = collectRemovedEntryIds(previous, next);
  const database = await openLatticeDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      [WORKSPACE_META_STORE_NAME, WORKSPACE_ENTRY_STORE_NAME, WORKSPACE_SEARCH_STORE_NAME],
      'readwrite',
    );
    const metaStore = transaction.objectStore(WORKSPACE_META_STORE_NAME);
    const entryStore = transaction.objectStore(WORKSPACE_ENTRY_STORE_NAME);
    const searchStore = transaction.objectStore(WORKSPACE_SEARCH_STORE_NAME);

    metaStore.put({
      owner: next.owner,
      entryIds: next.entryIds,
      corpusName: next.corpusName,
      selectedEntryId: next.selectedEntryId,
      corpusSyncState: next.corpusSyncState,
    } satisfies PersistedWorkspaceMeta, ACTIVE_WORKSPACE_META_KEY);

    removedEntryIds.forEach((entryId) => {
      entryStore.delete(entryId);
      searchStore.delete(entryId);
    });

    changedEntryIds.forEach((entryId) => {
      const entry = next.entriesById[entryId];
      if (!entry) {
        entryStore.delete(entryId);
        searchStore.delete(entryId);
        return;
      }

      const searchDoc = next.searchDocsById[entryId] ?? extractSearchableEntry(entry);
      entryStore.put(entry, entryId);
      searchStore.put(searchDoc, entryId);
    });

    transaction.oncomplete = () => {
      logInfo('workspace.persistence.patch_completed', {
        corpusName: next.corpusName,
        changedEntryCount: changedEntryIds.length,
        removedEntryCount: removedEntryIds.length,
      });
      resolve();
    };
    transaction.onerror = () => reject(new Error('Unable to save active workspace.'));
  });
}

export async function saveWorkspaceState(previous: PersistedWorkspaceState | null, next: PersistedWorkspaceState) {
  const replacingWorkspace = previous === null || shouldReplaceWorkspace(previous, next);
  logInfo('workspace.persistence.save_started', {
    corpusName: next.corpusName,
    entryCount: next.entryIds.length,
    mode: replacingWorkspace ? 'replace' : 'patch',
  });

  if (replacingWorkspace) {
    return replaceWorkspaceState(next);
  }

  return patchWorkspaceState(previous, next);
}

export async function readWorkspaceState() {
  const database = await openLatticeDatabase();
  logInfo('workspace.persistence.restore_started');
  return new Promise<PersistedWorkspaceState | null>((resolve, reject) => {
    const transaction = database.transaction(
      [WORKSPACE_META_STORE_NAME, WORKSPACE_ENTRY_STORE_NAME, WORKSPACE_SEARCH_STORE_NAME],
      'readonly',
    );
    const metaRequest = transaction.objectStore(WORKSPACE_META_STORE_NAME).get(ACTIVE_WORKSPACE_META_KEY);

    metaRequest.onsuccess = () => {
      if (!isWorkspaceMeta(metaRequest.result)) {
        logInfo('workspace.persistence.restore_empty');
        resolve(null);
        return;
      }

      const meta = metaRequest.result;
      const entryStore = transaction.objectStore(WORKSPACE_ENTRY_STORE_NAME);
      const searchStore = transaction.objectStore(WORKSPACE_SEARCH_STORE_NAME);
      const entryRequests = meta.entryIds.map((entryId) => ({ entryId, request: entryStore.get(entryId) }));
      const searchRequests = meta.entryIds.map((entryId) => ({ entryId, request: searchStore.get(entryId) }));

      transaction.oncomplete = () => {
        try {
          const corpus = normalizeCorpus(validateCorpus({
            version: '1.1',
            owner: meta.owner,
            entries: entryRequests
              .map(({ request }) => request.result as CorpusEntry | undefined)
              .filter((entry): entry is CorpusEntry => Boolean(entry)),
          }));
          const entriesById = Object.fromEntries(corpus.entries.map((entry) => [entry.id, entry]));
          const searchDocsById = Object.fromEntries(
            corpus.entries.map((entry) => {
              const persistedSearchDoc = searchRequests.find((request) => request.entryId === entry.id)?.request.result as SearchableEntry | undefined;
              return [entry.id, persistedSearchDoc ?? extractSearchableEntry(entry)];
            }),
          );

          logAction('workspace.persistence.restore_completed', {
            corpusName: meta.corpusName,
            entryCount: corpus.entries.length,
            selectedEntryId: meta.selectedEntryId,
          });
          resolve({
            owner: corpus.owner,
            entryIds: corpus.entries.map((entry) => entry.id),
            entriesById,
            searchDocsById,
            corpusName: meta.corpusName,
            selectedEntryId: meta.selectedEntryId,
            corpusSyncState: meta.corpusSyncState,
          });
        } catch {
          resolve(null);
        }
      };
    };

    transaction.onerror = () => reject(new Error('Unable to restore active workspace.'));
  });
}
