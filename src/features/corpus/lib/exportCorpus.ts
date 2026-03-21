import type { CorpusFile } from '../model/types';

export function exportCorpus(corpus: CorpusFile) {
  return JSON.stringify(corpus, null, 2);
}
