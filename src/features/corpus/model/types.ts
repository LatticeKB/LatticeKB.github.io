export type CorpusVersion = '1.1' | '1.2';

export type StoredBlock = Record<string, unknown>;

export type EntryBody = {
  format: 'blocknote@0.47';
  blocks: StoredBlock[];
};

export type CorpusEntry = {
  id: string;
  title: string;
  summary: string;
  product: string;
  category: string;
  tags: string[];
  aliases: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  body: EntryBody;
};

export type SearchMetricEntry = {
  openCount: number;
  qualifiedViewCount: number;
  shortAbandonCount: number;
  totalQualifiedDwellSeconds: number;
  longViewCount: number;
  lastViewedAt?: string;
};

export type SearchMetrics = {
  entries: Record<string, SearchMetricEntry>;
};

export type CorpusOwner = {
  name?: string;
  team?: string;
};

type CorpusBase = {
  owner: CorpusOwner;
  entries: CorpusEntry[];
};

export type LegacyCorpusFile = CorpusBase & {
  version: '1.1';
};

export type CorpusFile = CorpusBase & {
  version: '1.2';
  searchMetrics: SearchMetrics;
};

export type CorpusInput = LegacyCorpusFile | CorpusFile;

export type ImportedCorpus = {
  corpus: CorpusFile;
  filename: string;
};