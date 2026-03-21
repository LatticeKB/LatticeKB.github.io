import MiniSearch from 'minisearch';
import type { CorpusEntry } from '../../corpus/model/types';
import { extractSearchableEntry } from './extractSearchText';
import type { SearchableEntry } from '../model/searchTypes';

export type CorpusIndex = {
  miniSearch: MiniSearch<SearchableEntry>;
  entryMap: Map<string, CorpusEntry>;
};

export function buildIndex(entries: CorpusEntry[]): CorpusIndex {
  const miniSearch = new MiniSearch<SearchableEntry>({
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
  });

  const searchableEntries = entries.map(extractSearchableEntry);
  miniSearch.addAll(searchableEntries);

  return {
    miniSearch,
    entryMap: new Map(entries.map((entry) => [entry.id, entry])),
  };
}
