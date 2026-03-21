import { normalizeCorpus } from './normalizeCorpus';
import { validateCorpus } from './validators';
import type { ImportedCorpus } from '../model/types';

export async function importCorpus(file: File): Promise<ImportedCorpus> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  const corpus = normalizeCorpus(validateCorpus(parsed));
  return {
    corpus,
    filename: file.name,
  };
}
