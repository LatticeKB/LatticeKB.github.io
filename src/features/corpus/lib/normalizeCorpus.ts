import type { CorpusEntry, CorpusFile, CorpusInput, EntryBody } from '../model/types';
import { createId } from '../../../shared/lib/ids';
import { normalizeTags } from '../../tags/lib/normalizeTags';
import { normalizeSearchMetrics } from './searchMetrics';

function normalizeBody(body: EntryBody | undefined): EntryBody {
  return {
    format: 'blocknote@0.47',
    blocks: body?.blocks ?? [],
  };
}

function normalizeEntry(entry: CorpusEntry): CorpusEntry {
  const now = new Date().toISOString();
  return {
    id: entry.id || createId('entry'),
    title: entry.title.trim(),
    summary: entry.summary.trim(),
    product: entry.product.trim() || 'General',
    category: entry.category.trim() || 'Reference',
    tags: normalizeTags(entry.tags),
    aliases: entry.aliases.map((alias) => alias.trim()).filter(Boolean),
    pinned: entry.pinned,
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || entry.createdAt || now,
    body: normalizeBody(entry.body),
  };
}

export function normalizeCorpus(corpus: CorpusInput): CorpusFile {
  const entries = corpus.entries.map(normalizeEntry);

  return {
    version: '1.2',
    owner: {
      name: corpus.owner.name?.trim() || undefined,
      team: corpus.owner.team?.trim() || 'IT Support',
    },
    entries,
    searchMetrics: normalizeSearchMetrics('searchMetrics' in corpus ? corpus.searchMetrics : undefined, entries.map((entry) => entry.id)),
  };
}