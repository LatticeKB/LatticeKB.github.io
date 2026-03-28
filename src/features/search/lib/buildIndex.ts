import MiniSearch from 'minisearch';
import type { CorpusEntry } from '../../corpus/model/types';
import { extractSearchableEntry } from './extractSearchText';
import type { SearchableEntry, SearchHit } from '../model/searchTypes';
import { truncateText } from '../../../shared/lib/strings';
import { hasImageBlocks } from '../../images/lib/imageBlockHelpers';

const miniSearchOptions = {
  idField: 'id',
  fields: ['title', 'summary', 'product', 'category', 'tags', 'aliases', 'bodyText', 'imageCaptions'],
  storeFields: ['id', 'title', 'summary', 'bodyText', 'updatedAt', 'pinned'],
  searchOptions: {
    prefix: true,
    fuzzy: 0.2,
    boost: {
      title: 6,
      tags: 4,
      aliases: 4,
      summary: 3,
      product: 2,
      category: 2,
      imageCaptions: 2,
      bodyText: 1,
    },
  },
};

export type CorpusIndex = {
  miniSearch: MiniSearch<SearchableEntry>;
  entryMap: Map<string, CorpusEntry>;
  searchDocMap: Map<string, SearchableEntry>;
  fallbackHits: SearchHit[];
  imageEntryIds: Set<string>;
};

function createFallbackHit(entry: CorpusEntry, searchDoc: SearchableEntry): SearchHit {
  return {
    entry,
    score: entry.pinned ? 1 : 0,
    matchText: truncateText(entry.summary || searchDoc.bodyText, 180),
  };
}

function sortFallbackHits(hits: SearchHit[]) {
  return [...hits].sort((left, right) => {
    if (left.entry.pinned !== right.entry.pinned) {
      return Number(right.entry.pinned) - Number(left.entry.pinned);
    }

    return new Date(right.entry.updatedAt).getTime() - new Date(left.entry.updatedAt).getTime();
  });
}

function rebuildFallbackCaches(index: CorpusIndex) {
  const fallbackHits = Array.from(index.entryMap.values()).map((entry) => {
    const searchDoc = index.searchDocMap.get(entry.id) ?? extractSearchableEntry(entry);
    return createFallbackHit(entry, searchDoc);
  });

  index.fallbackHits = sortFallbackHits(fallbackHits);
  index.imageEntryIds = new Set(Array.from(index.entryMap.values())
    .filter((entry) => hasImageBlocks(entry.body.blocks))
    .map((entry) => entry.id));
}

export function buildIndex(
  entries: CorpusEntry[],
  searchDocsById?: Record<string, SearchableEntry> | Map<string, SearchableEntry>,
): CorpusIndex {
  const miniSearch = new MiniSearch<SearchableEntry>(miniSearchOptions);
  const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
  const searchDocMap = new Map<string, SearchableEntry>();

  entries.forEach((entry) => {
    const searchDoc = searchDocsById instanceof Map
      ? searchDocsById.get(entry.id)
      : searchDocsById?.[entry.id];
    const resolvedSearchDoc = searchDoc ?? extractSearchableEntry(entry);
    searchDocMap.set(entry.id, resolvedSearchDoc);
    miniSearch.add(resolvedSearchDoc);
  });

  const index: CorpusIndex = {
    miniSearch,
    entryMap,
    searchDocMap,
    fallbackHits: [],
    imageEntryIds: new Set(),
  };
  rebuildFallbackCaches(index);
  return index;
}

export function upsertIndexEntry(index: CorpusIndex, entry: CorpusEntry, searchDoc = extractSearchableEntry(entry)) {
  const existingDoc = index.searchDocMap.get(entry.id);
  if (existingDoc) {
    index.miniSearch.replace(searchDoc);
  } else {
    index.miniSearch.add(searchDoc);
  }

  index.entryMap.set(entry.id, entry);
  index.searchDocMap.set(entry.id, searchDoc);
  rebuildFallbackCaches(index);
}

export function removeIndexEntry(index: CorpusIndex, entryId: string) {
  const existingDoc = index.searchDocMap.get(entryId);
  if (existingDoc) {
    index.miniSearch.remove(existingDoc);
    index.searchDocMap.delete(entryId);
  }

  index.entryMap.delete(entryId);
  rebuildFallbackCaches(index);
}
