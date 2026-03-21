import type { CorpusEntry } from '../../corpus/model/types';
import { blocksToPlainText } from '../../editor/lib/blockTransforms';
import { extractImageMetadata } from '../../images/lib/imageBlockHelpers';
import type { SearchableEntry } from '../model/searchTypes';

export function extractSearchableEntry(entry: CorpusEntry): SearchableEntry {
  const bodyText = blocksToPlainText(entry.body.blocks);
  const images = extractImageMetadata(entry.body.blocks);

  return {
    id: entry.id,
    title: entry.title,
    summary: entry.summary,
    product: entry.product,
    category: entry.category,
    tags: entry.tags.join(' '),
    aliases: entry.aliases.join(' '),
    bodyText,
    imageCaptions: images.map((image) => `${image.caption} ${image.alt}`.trim()).join(' '),
    pinned: entry.pinned,
    updatedAt: entry.updatedAt,
  };
}
