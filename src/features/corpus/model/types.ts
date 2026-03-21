export type CorpusVersion = '1.1';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

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
  confidence: ConfidenceLevel;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  body: EntryBody;
};

export type CorpusOwner = {
  name?: string;
  team?: string;
};

export type CorpusFile = {
  version: CorpusVersion;
  owner: CorpusOwner;
  entries: CorpusEntry[];
};

export type ImportedCorpus = {
  corpus: CorpusFile;
  filename: string;
};
