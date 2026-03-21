import type { CorpusEntry } from '../../corpus/model/types';

export type SearchableEntry = {
  id: string;
  title: string;
  summary: string;
  product: string;
  category: string;
  tags: string;
  aliases: string;
  bodyText: string;
  imageCaptions: string;
  pinned: boolean;
  updatedAt: string;
};

export type SearchHit = {
  entry: CorpusEntry;
  score: number;
  matchText: string;
};

export type SearchFilters = {
  pinnedOnly: boolean;
  recentOnly: boolean;
  hasImages: boolean;
};
