import { ZodError } from 'zod';
import { corpusSchema } from '../model/schema';
import type { CorpusFile } from '../model/types';

export function validateCorpus(candidate: unknown): CorpusFile {
  try {
    return corpusSchema.parse(candidate);
  } catch (error) {
    if (error instanceof ZodError) {
      const detail = error.issues
        .slice(0, 4)
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');
      throw new Error(`Invalid corpus schema. ${detail}`);
    }

    throw error;
  }
}
