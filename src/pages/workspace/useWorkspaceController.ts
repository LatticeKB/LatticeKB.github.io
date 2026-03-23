import { useCallback, useEffect, useMemo, useState } from 'react';
import { exportCorpus } from '../../features/corpus/lib/exportCorpus';
import { importCorpus } from '../../features/corpus/lib/importCorpus';
import { openArticleInNewTab as launchArticleInNewTab } from '../../features/corpus/lib/openArticleInNewTab';
import { recordArticleOpen, recordArticleReadSession, type ArticleReadSession, ARTICLE_TELEMETRY_CHANNEL, isArticleTelemetryMessage } from '../../features/corpus/lib/searchMetrics';
import { sampleCorpus } from '../../features/corpus/model/sampleCorpus';
import type { CorpusEntry, CorpusFile } from '../../features/corpus/model/types';
import { getLastCorpusName, setLastCorpusName } from '../../features/persistence/lib/localState';
import { readWorkspaceState, saveWorkspaceState } from '../../features/persistence/lib/workspaceStore';
import { buildIndex } from '../../features/search/lib/buildIndex';
import { queryIndex } from '../../features/search/lib/queryIndex';
import type { SearchFilters } from '../../features/search/model/searchTypes';
import { downloadTextFile } from '../../shared/lib/download';
import { createId } from '../../shared/lib/ids';
import { createCorpusSyncState, hasPendingCorpusChanges } from './model/corpusSync';

const defaultFilters: SearchFilters = {
  pinnedOnly: false,
  recentOnly: false,
  hasImages: false,
};

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

export function useWorkspaceController() {
  const initialCorpusName = getLastCorpusName() ?? 'sample-corpus.json';
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [corpus, setCorpus] = useState<CorpusFile>(sampleCorpus);
  const [corpusName, setCorpusName] = useState(initialCorpusName);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(sampleCorpus.entries[0]?.id ?? null);
  const [editorSession, setEditorSession] = useState<EditorSession>({ open: false, mode: 'closed', entry: null });
  const [viewerSession, setViewerSession] = useState<ViewerSession>({ open: false, entry: null });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [corpusSyncState, setCorpusSyncState] = useState(() => createCorpusSyncState(sampleCorpus, initialCorpusName, 'sample'));

  useEffect(() => {
    let isCancelled = false;

    void readWorkspaceState()
      .then((storedWorkspace) => {
        if (isCancelled || !storedWorkspace) {
          return;
        }

        setCorpus(storedWorkspace.corpus);
        setCorpusName(storedWorkspace.corpusName);
        setSelectedEntryId(storedWorkspace.selectedEntryId ?? storedWorkspace.corpus.entries[0]?.id ?? null);
        setCorpusSyncState(storedWorkspace.corpusSyncState);
        setLastCorpusName(storedWorkspace.corpusName);
      })
      .catch((error) => {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to restore local workspace.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
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

    setLastCorpusName(corpusName);
    void saveWorkspaceState({
      corpus,
      corpusName,
      selectedEntryId,
      corpusSyncState,
    }).catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save active workspace.');
    });
  }, [corpus, corpusName, corpusSyncState, selectedEntryId, workspaceReady]);

  const applyArticleOpen = useCallback((entryId: string) => {
    setCorpus((current) => recordArticleOpen(current, entryId));
  }, []);

  const applyArticleReadSession = useCallback((entryId: string, session: ArticleReadSession) => {
    setCorpus((current) => recordArticleReadSession(current, entryId, session));
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(ARTICLE_TELEMETRY_CHANNEL);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (!isArticleTelemetryMessage(event.data) || event.data.corpusName !== corpusName) {
        return;
      }

      applyArticleReadSession(event.data.entryId, event.data.session);
    };

    return () => {
      channel.close();
    };
  }, [applyArticleReadSession, corpusName]);

  const searchIndex = useMemo(() => buildIndex(corpus.entries), [corpus.entries]);
  const results = useMemo(() => queryIndex(searchIndex, query, filters), [filters, query, searchIndex]);
  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) {
      return results[0]?.entry ?? corpus.entries[0] ?? null;
    }

    return corpus.entries.find((entry) => entry.id === selectedEntryId) ?? results[0]?.entry ?? null;
  }, [corpus.entries, results, selectedEntryId]);
  const hasUnsyncedCorpusChanges = useMemo(() => hasPendingCorpusChanges(corpusSyncState, corpus), [corpus, corpusSyncState]);

  function updateFilters(next: Partial<SearchFilters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  function setSearchQuery(nextQuery: string) {
    setQuery(nextQuery);
  }

  function openNewArticle() {
    setViewerSession({ open: false, entry: null });
    setEditorSession({ open: true, mode: 'create', entry: createEmptyEntry() });
  }

  function openArticle(entry: CorpusEntry) {
    applyArticleOpen(entry.id);
    setSelectedEntryId(entry.id);
    setViewerSession({ open: true, entry });
  }

  const openArticleInNewTab = useCallback((entry: CorpusEntry) => {
    applyArticleOpen(entry.id);
    launchArticleInNewTab(entry, corpusName);
  }, [applyArticleOpen, corpusName]);

  const finalizeArticleReadSession = useCallback((entry: CorpusEntry, session: ArticleReadSession) => {
    applyArticleReadSession(entry.id, session);
  }, [applyArticleReadSession]);

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

    setCorpus((current) => {
      const remainingEntries = current.entries.filter((entry) => entry.id !== entryId);

      if (remainingEntries.length === current.entries.length) {
        nextSelectedEntryId = selectedEntryId;
        return current;
      }

      didDelete = true;
      nextSelectedEntryId = selectedEntryId === entryId ? (remainingEntries[0]?.id ?? null) : (selectedEntryId ?? remainingEntries[0]?.id ?? null);
      const { [entryId]: _deletedMetrics, ...remainingMetrics } = current.searchMetrics.entries;

      return {
        ...current,
        entries: remainingEntries,
        searchMetrics: {
          entries: remainingMetrics,
        },
      };
    });

    if (!didDelete) {
      return;
    }

    setSelectedEntryId(nextSelectedEntryId);
    setViewerSession((current) => (current.entry?.id === entryId ? { open: false, entry: null } : current));
    setEditorSession((current) => (current.entry?.id === entryId ? { open: false, mode: 'closed', entry: null } : current));
  }

  function togglePinned(entryId: string) {
    let updatedEntry: CorpusEntry | null = null;

    setCorpus((current) => {
      const entries = current.entries.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }

        updatedEntry = {
          ...entry,
          pinned: !entry.pinned,
          updatedAt: new Date().toISOString(),
        };

        return updatedEntry;
      });

      return { ...current, entries };
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
    setCorpus((current) => {
      const exists = current.entries.some((entry) => entry.id === nextEntry.id);
      const entries = exists
        ? current.entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry))
        : [nextEntry, ...current.entries];
      return { ...current, entries };
    });
    setSelectedEntryId(nextEntry.id);
    setViewerSession({ open: true, entry: nextEntry });
    closeEditor();
  }

  async function loadCorpusFromFile(file: File) {
    try {
      const imported = await importCorpus(file);
      setCorpus(imported.corpus);
      setCorpusName(imported.filename);
      setLastCorpusName(imported.filename);
      setCorpusSyncState(createCorpusSyncState(imported.corpus, imported.filename, 'file'));
      setSelectedEntryId(imported.corpus.entries[0]?.id ?? null);
      setViewerSession({ open: false, entry: null });
      setEditorSession({ open: false, mode: 'closed', entry: null });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to import corpus.');
    }
  }

  function downloadCorpus() {
    const safeName = corpusName.endsWith('.json') ? corpusName : 'corpus.json';
    const snapshot = exportCorpus(corpus);
    downloadTextFile(safeName, snapshot);
    setCorpusSyncState({
      baselineSnapshot: snapshot,
      baselineName: safeName,
      origin: 'download',
    });
  }

  return {
    workspaceReady,
    corpus,
    corpusName,
    query,
    setQuery: setSearchQuery,
    filters,
    updateFilters,
    results,
    selectedEntry,
    selectedEntryId,
    setSelectedEntryId,
    viewerSession,
    openArticle,
    openArticleInNewTab,
    finalizeArticleReadSession,
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
    corpusSyncState,
    hasUnsyncedCorpusChanges,
    errorMessage,
  };
}