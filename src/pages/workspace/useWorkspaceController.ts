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
import { logAction, logError, logInfo, logWarning } from '../../shared/lib/clientLogger';
import { createId } from '../../shared/lib/ids';
import { createCorpusSyncState, hasPendingCorpusChanges } from './model/corpusSync';

const defaultFilters: SearchFilters = {
  pinnedOnly: false,
  recentOnly: false,
  hasImages: false,
};

const WORKSPACE_SAVE_DEBOUNCE_MS = 400;
const SEARCH_EXECUTION_DEBOUNCE_MS = 120;
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
  const [executedQuery, setExecutedQuery] = useState('');
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
          logAction('workspace.restore_applied', {
            corpusName: storedWorkspace.corpusName,
            entryCount: storedWorkspace.entryIds.length,
          });
        }

        setWorkspaceReady(true);
      })
      .catch((error) => {
        if (!isCancelled) {
          logError('workspace.restore_failed', error);
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
      logInfo('workspace.search.rebuild_index', {
        entryCount: workspace.entryIds.length,
      });
      searchIndexRef.current = buildIndex(entries, workspace.searchDocsById);
    } else {
      if (removedEntryIds.length > 0 || changedEntryIds.length > 0) {
        logInfo('workspace.search.incremental_index_update', {
          changedEntryCount: changedEntryIds.length,
          removedEntryCount: removedEntryIds.length,
        });
      }
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
          logInfo('workspace.persistence.save_completed', {
            corpusName: workspace.corpusName,
            entryCount: workspace.entryIds.length,
          });
          persistedWorkspaceRef.current = workspace;
        })
        .catch((error) => {
          logError('workspace.persistence.save_failed', error, {
            corpusName: workspace.corpusName,
            entryCount: workspace.entryIds.length,
          });
          setErrorMessage(error instanceof Error ? error.message : 'Unable to save active workspace.');
        });
    }, WORKSPACE_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [workspace, workspaceReady]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setExecutedQuery('');
      return;
    }

    const handle = window.setTimeout(() => {
      logInfo('workspace.search.executed', {
        queryLength: query.length,
        debounceMs: SEARCH_EXECUTION_DEBOUNCE_MS,
      });
      setExecutedQuery(query);
    }, SEARCH_EXECUTION_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [query]);

  const results = useMemo(() => queryIndex(searchIndexRef.current, executedQuery, filters), [executedQuery, filters, searchRevision, workspace]);
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
    logAction('workspace.filters.updated', next);
    setFilters((current) => ({ ...current, ...next }));
  }

  function setSearchQuery(nextQuery: string) {
    logAction('workspace.search.query_changed', {
      queryLength: nextQuery.length,
      hasQuery: nextQuery.trim().length > 0,
    });
    if (!nextQuery.trim()) {
      logInfo('workspace.search.executed', {
        queryLength: 0,
        debounceMs: 0,
      });
    }
    setQuery(nextQuery);
  }

  function setSelectedEntryId(nextSelectedEntryId: string | null) {
    logAction('workspace.selection.changed', {
      entryId: nextSelectedEntryId,
    });
    setWorkspace((current) => (
      current.selectedEntryId === nextSelectedEntryId
        ? current
        : { ...current, selectedEntryId: nextSelectedEntryId }
    ));
  }

  function openNewArticle() {
    logAction('workspace.article.new_opened');
    setViewerSession({ open: false, entry: null });
    setEditorSession({ open: true, mode: 'create', entry: createEmptyEntry() });
  }

  function openArticle(entry: CorpusEntry) {
    logAction('workspace.article.opened', {
      entryId: entry.id,
      title: entry.title,
    });
    setSelectedEntryId(entry.id);
    setViewerSession({ open: true, entry });
  }

  function openEditArticle(entry: CorpusEntry) {
    logAction('workspace.article.edit_opened', {
      entryId: entry.id,
      title: entry.title,
    });
    setViewerSession({ open: false, entry: null });
    setEditorSession({ open: true, mode: 'edit', entry });
  }

  function closeViewer() {
    logAction('workspace.article.viewer_closed', {
      entryId: viewerSession.entry?.id ?? null,
    });
    setViewerSession({ open: false, entry: null });
  }

  function closeEditor() {
    logAction('workspace.article.editor_closed', {
      entryId: editorSession.entry?.id ?? null,
      mode: editorSession.mode,
    });
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
      logWarning('workspace.article.delete_missing', { entryId });
      return;
    }

    logAction('workspace.article.deleted', {
      entryId,
      nextSelectedEntryId,
    });
    setViewerSession((current) => (current.entry?.id === entryId ? { open: false, entry: null } : current));
    setEditorSession((current) => (current.entry?.id === entryId ? { open: false, mode: 'closed', entry: null } : current));
  }

  function togglePinned(entryId: string) {
    const currentEntry = workspace.entriesById[entryId];
    if (!currentEntry) {
      logWarning('workspace.article.pin_toggle_missing', { entryId });
      return;
    }

    const nextUpdatedEntry: CorpusEntry = {
      ...currentEntry,
      pinned: !currentEntry.pinned,
      updatedAt: new Date().toISOString(),
    };

    setWorkspace((current) => (
      current.entriesById[entryId]
        ? upsertWorkspaceEntry(current, nextUpdatedEntry)
        : current
    ));

    logAction('workspace.article.pin_toggled', {
      entryId,
      pinned: nextUpdatedEntry.pinned,
    });
    if (viewerSession.open && viewerSession.entry?.id === entryId) {
      setViewerSession({ open: true, entry: nextUpdatedEntry });
    }

    if (editorSession.open && editorSession.entry?.id === entryId) {
      setEditorSession({ ...editorSession, entry: nextUpdatedEntry });
    }
  }

  function saveEntry(nextEntry: CorpusEntry) {
    logAction('workspace.article.saved', {
      entryId: nextEntry.id,
      title: nextEntry.title,
      isNew: !workspace.entriesById[nextEntry.id],
    });
    setWorkspace((current) => upsertWorkspaceEntry(current, nextEntry, {
      prependIfNew: !current.entriesById[nextEntry.id],
      selectedEntryId: nextEntry.id,
    }));
    setViewerSession({ open: true, entry: nextEntry });
    closeEditor();
  }

  async function loadCorpusFromFile(file: File) {
    logAction('workspace.corpus.load_started', {
      fileName: file.name,
      fileSize: file.size,
    });
    try {
      const imported = await importCorpus(file);
      const importedWorkspace = createWorkspaceState({
        corpus: imported.corpus,
        corpusName: imported.filename,
        selectedEntryId: imported.corpus.entries[0]?.id ?? null,
        corpusSyncState: createCorpusSyncState(imported.corpus, imported.filename, 'file'),
      });
      logAction('workspace.corpus.load_completed', {
        fileName: imported.filename,
        entryCount: imported.corpus.entries.length,
      });
      setWorkspace(importedWorkspace);
      setLastCorpusName(importedWorkspace.corpusName);
      setViewerSession({ open: false, entry: null });
      setEditorSession({ open: false, mode: 'closed', entry: null });
      setErrorMessage(null);
    } catch (error) {
      logError('workspace.corpus.load_failed', error, {
        fileName: file.name,
        fileSize: file.size,
      });
      setErrorMessage(error instanceof Error ? error.message : 'Unable to import corpus.');
    }
  }

  function downloadCorpus() {
    const safeName = workspace.corpusName.endsWith('.json') ? workspace.corpusName : 'corpus.json';
    logAction('workspace.corpus.downloaded', {
      fileName: safeName,
      entryCount: workspace.entryIds.length,
      snapshotLength: currentSnapshot.length,
    });
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
