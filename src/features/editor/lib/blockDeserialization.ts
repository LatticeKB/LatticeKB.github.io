import type { EntryBody } from '../../corpus/model/types';

export function deserializeBodyToBlocks(body: EntryBody) {
  return body.blocks as Record<string, unknown>[];
}
