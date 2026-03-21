import type { EntryBody } from '../../corpus/model/types';

export function serializeBlocksToBody(blocks: Record<string, unknown>[]): EntryBody {
  return {
    format: 'blocknote@0.47',
    blocks,
  };
}
