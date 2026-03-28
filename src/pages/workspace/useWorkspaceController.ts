import { useEffect, useMemo, useRef, useState } from 'react';
import type { CorpusEntry } from '../../features/corpus/model/types';
import { sampleCorpus } from '../../features/corpus/model/sampleCorpus';
import { buildIndex, removeIndexEntry, upsertIndexEntry } from '../../features/search/lib/buildIndex';
import type { SearchFilters } from '../../features/search/model/searchTypes';
import { queryIndex } from '../../features/search/lib/queryIndex';
import { exportCorpus } from '../../features/corpus/lib/exportCorpus';
import { downloadTextFile } from '../../shared/lib/download';
import { importCorpus } from '../../features/corpus/lib/importCorpus';
import { setLastCorpusName, getLastCorpusName } from '../../features/persistence/lib/localState';
import {
  createWorkspaceState,
  materializeCorpus,
  readWorkspaceState,
  saveWorkspaceState,
  type PersistedWorkspaceState,
} from '../../features/persistence/lib/workspaceStore';
import { extractSearchableEntry } from '../../features/search/lib/extractSearchText';
import { createId } from '../../shared/lib/ids';
import { createCorpusSyncState, hasPendingCorpusChanges } from './model/corpusSync';

const defaultFilters: SearchFilters = {
  pinnedOnly: false,
  recentOnly: false,
  hasImages: false,
};

const WORKSPACE_SAVE_DEBOUNCE_MS = 400;

export type EditorSession =
  | { open: false; mode: 'closed'; entry: null }
  | { open: true; mode: 'create' | 'edit'; entry: CorpusEntry };

export type ViewerSession =
  | { open: false; entry: null }
  | { open: true; entry: CorpusEntry };

function createEmptyEntry(): CorpusEntry {
  const now = new Date().toISOString();
  return {
    id: createId('entry'),
    title: '',
    summary: '',
    product: 'General',
    category: 'Reference',
    tags: [],
    aliases: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
    body: {
      format: 'blocknote@0.47',
      blocks: [],
    },
  };
}

function buildInitialWorkspaceState(corpusName: string) {
  return createWorkspaceState({
    corpus: sampleCorpus,
    corpusName,
    selectedEntryId: sampleCorpus.entries[0]?.id ?? null,
    corpusSyncState: createCorpusSyncState(sampleCorpus, corpusName, 'sample'),
  });
}

function upsertWorkspaceEntry(
  current: PersistedWorkspaceState,
  nextEntry: CorpusEntry,
  options: { prependIfNew?: boolean; selectedEntryId?: string | null } = {},
): PersistedWorkspaceState {
  const exists = Boolean(current.entriesById[nextEntry.id]);
  const searchDoc = extractSearchableEntry(nextEntry);

  return {
    ...current,
    entryIds: exists
      ? current.entryIds
      : options.prependIfNew
        ? [nextEntry.id, ...current.entryIds]
        : [...current.entryIds, nextEntry.id],
    entriesById: {
      ...current.entriesById,
      [nextEntry.id]: nextEntry,
    },
    searchDocsById: {
      ...current.searchDocsById,
      [nextEntry.id]: searchDoc,
    },
    selectedEntryId: options.selectedEntryId === undefined ? current.selectedEntryId : options.selectedEntryId,
  };
}

function removeWorkspaceEntry(current: PersistedWorkspaceState, entryId: string, nextSelectedEntryId: string | null): PersistedWorkspaceState {
  const { [entryId]: _removedEntry, ...remainingEntries } = current.entriesById;
  const { [entryId]: _removedSearchDoc, ...remainingSearchDocs } = current.searchDocsById;

  return {
    ...current,
    entryIds: current.entryIds.filter((currentEntryId) => currentEntryId !== entryId),
    entriesById: remainingEntries,
    searchDocsById: remainingSearchDocs,
    selectedEntryId: nextSelectedEntryId,
  };
}

export function useWorkspaceController() {
  const initialCorpusName = getLastCorpusName() ?? 'sample-corpus.json';
  const initialWorkspace = useRef(buildInitialWorkspaceState(initialCorpusName)).current;
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspace, setWorkspace] = useState<PersistedWorkspaceState>(initialWorkspace);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [editorSession, setEditorSession] = useState<EditorSession>({ open: false, mode: 'closed', entry: null });
  const [viewerSession, setViewerSession] = useState<ViewerSession>({ open: false, entry: null });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchRevision, setSearchRevision] = useState(0);
  const persistedWorkspaceRef = useRef<PersistedWorkspaceState | null>(null);
  const indexedWorkspaceRef = useRef<PersistedWorkspaceState>(initialWorkspace);
  const searchIndexRef = useRef(buildIndex(sampleCorpus.entries, initialWorkspace.searchDocsById));

  const entries = useMemo(
    () => workspace.entryIds.map((entryId) => workspace.entriesById[entryId]).filter((entry): entry is CorpusEntry => Boolean(entry)),
    [workspace.entryIds, workspace.entriesById],
  );
  const corpus = useMemo(
    () => materializeCorpus(workspace),
    [workspace.owner, workspace.entryIds, workspace.entriesById],
  );
  const currentSnapshot = useMemo(() => exportCorpus(corpus), [corpus]);

  useEffect(() => {
    let isCancelled = false;

    void readWorkspaceState()
      .then((storedWorkspace) => {
        if (isCancelled) {
          return;
        }

        if (storedWorkspace) {
          setWorkspace(storedWorkspace);
          persistedWorkspaceRef.current = storedWorkspace;
          indexedWorkspaceRef.current = storedWorkspace;
          searchIndexRef.current = buildIndex(
            storedWorkspace.entryIds
              .map((entryId) => storedWorkspace.entriesById[entryId])
              .filter((entry): entry is CorpusEntry => Boolean(entry)),
            storedWorkspace.searchDocsById,
          );
          setLastCorpusName(storedWorkspace.corpusName);
        }

        setWorkspaceReady(true);
      })
      .catch((error) => {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to restore local workspace.');
          setWorkspaceReady(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!workspaceReady) {
      return;
    }

    const previous = indexedWorkspaceRef.current;
    if (previous === workspace) {
      return;
    }

    const nextIds = new Set(workspace.entryIds);
    const removedEntryIds = previous.entryIds.filter((entryId) => !nextIds.has(entryId));
    const changedEntryIds = workspace.entryIds.filter(
      (entryId) => previous.entriesById[entryId] !== workspace.entriesById[entryId]
        || previous.searchDocsById[entryId] !== workspace.searchDocsById[entryId],
    );
    const shouldRebuild = previous.owner !== workspace.owner
      || removedEntryIds.length + changedEntryIds.length > Math.max(25, workspace.entryIds.length / 3);

    if (shouldRebuild) {
      searchIndexRef.current = buildIndex(entries, workspace.searchDocsById);
    } else {
      removedEntryIds.forEach((entryId) => removeIndexEntry(searchIndexRef.current, entryId));
      changedEntryIds.forEach((entryId) => {
        const entry = workspace.entriesById[entryId];
        if (!entry) {
          return;
        }

        upsertIndexEntry(searchIndexRef.current, entry, workspace.searchDocsById[entryId]);
      });
    }

    indexedWorkspaceRef.current = workspace;
    setSearchRevision((current) => current + 1);
  }, [entries, workspace, workspaceReady]);

  useEffect(() => {
    if (!workspaceReady || persistedWorkspaceRef.current === workspace) {
      return;
    }

    const handle = window.setTimeout(() => {
      setLastCorpusName(workspace.corpusName);
      void saveWorkspaceState(persistedWorkspaceRef.current, workspace)
        .then(() => {
          persistedWorkspaceRef.current = workspace;
        })
        .catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to save active workspace.');
        });
    }, WORKSPACE_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [workspace, workspaceReady]);

  const results = useMemo(() => queryIndex(searchIndexRef.current, query, filters), [filters, query, searchRevision, workspace]);
  const selectedEntry = useMemo(() => {
    if (!workspace.selectedEntryId) {
      return results[0]?.entry ?? entries[0] ?? null;
    }

    return workspace.entriesById[workspace.selectedEntryId] ?? results[0]?.entry ?? null;
  }, [entries, results, workspace.entriesById, workspace.selectedEntryId]);
  const hasUnsyncedCorpusChanges = useMemo(
    () => hasPendingCorpusChanges(workspace.corpusSyncState, currentSnapshot),
    [currentSnapshot, workspace.corpusSyncState],
  );

  function updateFilters(next: Partial<SearchFilters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  function setSearchQuery(nextQuery: string) {
    setQuery(nextQuery);
  }

  function setSelectedEntryId(nextSelectedEntryId: string | null) {
    setWorkspace((current) => (
      current.selectedEntryId === nextSelectedEntryId
        ? current
        : { ...current, selectedEntryId: nextSelectedEntryId }
    ));
  }

  function openNewArticle() {
    setViewerSession({ open: false, entry: null });
    setEditorSession({ open: true, mode: 'create', entry: createEmptyEntry() });
  }

  function openArticle(entry: CorpusEntry) {
    setSelectedEntryId(entry.id);
    setViewerSession({ open: true, entry });
  }

  function openEditArticle(entry: CorpusEntry) {
    setViewerSession({ open: false, entry: null });
    setEditorSession({ open: true, mode: 'edit', entry });
  }

  function closeViewer() {
    setViewerSession({ open: false, entry: null });
  }

  function closeEditor() {
    setEditorSession({ open: false, mode: 'closed', entry: null });
  }

  function deleteEntry(entryId: string) {
    let didDelete = false;
    let nextSelectedEntryId: string | null = null;

    setWorkspace((current) => {
      if (!current.entriesById[entryId]) {
        nextSelectedEntryId = current.selectedEntryId;
        return current;
      }

      didDelete = true;
      const remainingEntryIds = current.entryIds.filter((currentEntryId) => currentEntryId !== entryId);
      nextSelectedEntryId = current.selectedEntryId === entryId
        ? (remainingEntryIds[0] ?? null)
        : (current.selectedEntryId ?? remainingEntryIds[0] ?? null);
      return removeWorkspaceEntry(current, entryId, nextSelectedEntryId);
    });

    if (!didDelete) {
      return;
    }

    setViewerSession((current) => (current.entry?.id === entryId ? { open: false, entry: null } : current));
    setEditorSession((current) => (current.entry?.id === entryId ? { open: false, mode: 'closed', entry: null } : current));
  }

  function togglePinned(entryId: string) {
    let updatedEntry: CorpusEntry | null = null;

    setWorkspace((current) => {
      const existingEntry = current.entriesById[entryId];
      if (!existingEntry) {
        return current;
      }

      updatedEntry = {
        ...existingEntry,
        pinned: !existingEntry.pinned,
        updatedAt: new Date().toISOString(),
      };

      return upsertWorkspaceEntry(current, updatedEntry);
    });

    if (!updatedEntry) {
      return;
    }

    if (viewerSession.open && viewerSession.entry?.id === entryId) {
      setViewerSession({ open: true, entry: updatedEntry });
    }

    if (editorSession.open && editorSession.entry?.id === entryId) {
      setEditorSession({ ...editorSession, entry: updatedEntry });
    }
  }

  function saveEntry(nextEntry: CorpusEntry) {
    setWorkspace((current) => upsertWorkspaceEntry(current, nextEntry, {
      prependIfNew: !current.entriesById[nextEntry.id],
      selectedEntryId: nextEntry.id,
    }));
    setViewerSession({ open: true, entry: nextEntry });
    closeEditor();
  }

  async function loadCorpusFromFile(file: File) {
    try {
      const imported = await importCorpus(file);
      const importedWorkspace = createWorkspaceState({
        corpus: imported.corpus,
        corpusName: imported.filename,
        selectedEntryId: imported.corpus.entries[0]?.id ?? null,
        corpusSyncState: createCorpusSyncState(imported.corpus, imported.filename, 'file'),
      });
      setWorkspace(importedWorkspace);
      setLastCorpusName(importedWorkspace.corpusName);
      setViewerSession({ open: false, entry: null });
      setEditorSession({ open: false, mode: 'closed', entry: null });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to import corpus.');
    }
  }

  function downloadCorpus() {
    const safeName = workspace.corpusName.endsWith('.json') ? workspace.corpusName : 'corpus.json';
    downloadTextFile(safeName, currentSnapshot);
    setWorkspace((current) => ({
      ...current,
      corpusSyncState: {
        baselineSnapshot: currentSnapshot,
        baselineName: safeName,
        origin: 'download',
      },
    }));
  }

  return {
    workspaceReady,
    corpus,
    corpusName: workspace.corpusName,
    query,
    setQuery: setSearchQuery,
    filters,
    updateFilters,
    results,
    selectedEntry,
    selectedEntryId: workspace.selectedEntryId,
    setSelectedEntryId,
    viewerSession,
    openArticle,
    closeViewer,
    editorSession,
    openNewArticle,
    openEditArticle,
    closeEditor,
    saveEntry,
    deleteEntry,
    togglePinned,
    loadCorpusFromFile,
    downloadCorpus,
    corpusSyncState: workspace.corpusSyncState,
    hasUnsyncedCorpusChanges,
    errorMessage,
  };
}
