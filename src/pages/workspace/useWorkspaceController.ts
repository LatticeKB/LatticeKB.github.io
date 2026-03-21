import { useMemo, useState } from 'react';
import type { CorpusEntry, CorpusFile } from '../../features/corpus/model/types';
import { sampleCorpus } from '../../features/corpus/model/sampleCorpus';
import { buildIndex } from '../../features/search/lib/buildIndex';
import type { SearchFilters } from '../../features/search/model/searchTypes';
import { queryIndex } from '../../features/search/lib/queryIndex';
import { exportCorpus } from '../../features/corpus/lib/exportCorpus';
import { downloadTextFile } from '../../shared/lib/download';
import { importCorpus } from '../../features/corpus/lib/importCorpus';
import { setLastCorpusName, getLastCorpusName } from '../../features/persistence/lib/localState';
import { createId } from '../../shared/lib/ids';

const defaultFilters: SearchFilters = {
  pinnedOnly: false,
  recentOnly: false,
  hasImages: false,
};

export type EditorSession =
  | { open: false; mode: 'closed'; entry: null }
  | { open: true; mode: 'create' | 'edit'; entry: CorpusEntry };

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
    confidence: 'medium',
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
  const [corpus, setCorpus] = useState<CorpusFile>(sampleCorpus);
  const [corpusName, setCorpusName] = useState(getLastCorpusName() ?? 'sample-corpus.json');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(sampleCorpus.entries[0]?.id ?? null);
  const [editorSession, setEditorSession] = useState<EditorSession>({ open: false, mode: 'closed', entry: null });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rankingOpen, setRankingOpen] = useState(false);

  const searchIndex = useMemo(() => buildIndex(corpus.entries), [corpus.entries]);
  const results = useMemo(() => queryIndex(searchIndex, query, filters), [filters, query, searchIndex]);
  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) {
      return results[0]?.entry ?? corpus.entries[0] ?? null;
    }

    return corpus.entries.find((entry) => entry.id === selectedEntryId) ?? results[0]?.entry ?? null;
  }, [corpus.entries, results, selectedEntryId]);


  function updateFilters(next: Partial<SearchFilters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  function openNewArticle() {
    setEditorSession({ open: true, mode: 'create', entry: createEmptyEntry() });
  }

  function openEditArticle(entry: CorpusEntry) {
    setEditorSession({ open: true, mode: 'edit', entry });
  }

  function closeEditor() {
    setEditorSession({ open: false, mode: 'closed', entry: null });
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
    closeEditor();
  }

  async function loadCorpusFromFile(file: File) {
    try {
      const imported = await importCorpus(file);
      setCorpus(imported.corpus);
      setCorpusName(imported.filename);
      setLastCorpusName(imported.filename);
      setSelectedEntryId(imported.corpus.entries[0]?.id ?? null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to import corpus.');
    }
  }

  function downloadCorpus() {
    const safeName = corpusName.endsWith('.json') ? corpusName : 'corpus.json';
    downloadTextFile(safeName, exportCorpus(corpus));
  }

  return {
    corpus,
    corpusName,
    query,
    setQuery,
    filters,
    updateFilters,
    results,
    selectedEntry,
    selectedEntryId,
    setSelectedEntryId,
    editorSession,
    openNewArticle,
    openEditArticle,
    closeEditor,
    saveEntry,
    loadCorpusFromFile,
    downloadCorpus,
    errorMessage,
    rankingOpen,
    setRankingOpen,
  };
}
