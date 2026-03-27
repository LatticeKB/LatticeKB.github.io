import type { CorpusEntry } from '../../corpus/model/types';
import { extractSearchableEntry } from '../../search/lib/extractSearchText';
import { normalizeTags } from './normalizeTags';

const tokenPattern = /[a-z0-9][a-z0-9-]+/g;
const TOP_SUGGESTION_COUNT = 5;
const fieldWeights = {
  title: 5,
  aliases: 4,
  summary: 3,
  product: 2,
  category: 2,
  bodyText: 1,
  imageCaptions: 1,
} as const;

type DraftFields = ReturnType<typeof extractSearchableEntry>;

function tokenize(value: string) {
  return value.toLowerCase().match(tokenPattern) ?? [];
}

function countTokenWeights(text: string, weight: number, counts: Map<string, number>) {
  tokenize(text).forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + weight);
  });
}

function buildDraftTokenWeights(fields: DraftFields) {
  const counts = new Map<string, number>();
  countTokenWeights(fields.title, fieldWeights.title, counts);
  countTokenWeights(fields.aliases, fieldWeights.aliases, counts);
  countTokenWeights(fields.summary, fieldWeights.summary, counts);
  countTokenWeights(fields.product, fieldWeights.product, counts);
  countTokenWeights(fields.category, fieldWeights.category, counts);
  countTokenWeights(fields.bodyText, fieldWeights.bodyText, counts);
  countTokenWeights(fields.imageCaptions, fieldWeights.imageCaptions, counts);
  return counts;
}

function normalizeCandidate(rawTag: string) {
  return normalizeTags([rawTag])[0] ?? null;
}

function collectDynamicCandidates(entry: CorpusEntry, corpusEntries: CorpusEntry[]) {
  const candidates = new Set<string>();

  corpusEntries.forEach((candidateEntry) => {
    if (candidateEntry.id === entry.id) {
      return;
    }

    candidateEntry.tags.forEach((tag) => {
      const normalized = normalizeCandidate(tag);
      if (normalized) {
        candidates.add(normalized);
      }
    });
  });

  entry.aliases.forEach((alias) => {
    const normalized = normalizeCandidate(alias);
    if (normalized) {
      candidates.add(normalized);
    }
  });

  [entry.product, entry.category].forEach((value) => {
    const normalized = normalizeCandidate(value);
    if (normalized) {
      candidates.add(normalized);
    }
  });

  return [...candidates];
}

function scoreDirectMatches(tag: string, fields: DraftFields, tokenWeights: Map<string, number>) {
  const tagTokens = tokenize(tag);
  if (tagTokens.length === 0) {
    return 0;
  }

  let score = 0;
  tagTokens.forEach((token) => {
    score += tokenWeights.get(token) ?? 0;
  });

  const loweredTag = tag.toLowerCase();
  if (fields.title.toLowerCase().includes(loweredTag)) score += fieldWeights.title * 3;
  if (fields.aliases.toLowerCase().includes(loweredTag)) score += fieldWeights.aliases * 3;
  if (fields.summary.toLowerCase().includes(loweredTag)) score += fieldWeights.summary * 2;
  if (fields.product.toLowerCase().includes(loweredTag)) score += fieldWeights.product * 3;
  if (fields.category.toLowerCase().includes(loweredTag)) score += fieldWeights.category * 3;
  if (fields.bodyText.toLowerCase().includes(loweredTag)) score += fieldWeights.bodyText * 2;
  if (fields.imageCaptions.toLowerCase().includes(loweredTag)) score += fieldWeights.imageCaptions * 2;

  return score / tagTokens.length;
}

function buildCorpusTagAffinity(entry: CorpusEntry, corpusEntries: CorpusEntry[], tokenWeights: Map<string, number>) {
  const affinity = new Map<string, number>();

  corpusEntries.forEach((candidateEntry) => {
    if (candidateEntry.id === entry.id || candidateEntry.tags.length === 0) {
      return;
    }

    const searchableEntry = extractSearchableEntry(candidateEntry);
    const entryTokens = new Set(tokenize([
      searchableEntry.title,
      searchableEntry.summary,
      searchableEntry.product,
      searchableEntry.category,
      searchableEntry.aliases,
      searchableEntry.bodyText,
      searchableEntry.imageCaptions,
    ].join(' ')));

    if (entryTokens.size === 0) {
      return;
    }

    let similarity = 0;
    entryTokens.forEach((token) => {
      similarity += tokenWeights.get(token) ?? 0;
    });

    if (similarity === 0) {
      return;
    }

    const normalizedSimilarity = similarity / Math.sqrt(entryTokens.size);
    candidateEntry.tags.forEach((tag) => {
      const normalized = normalizeCandidate(tag);
      if (!normalized) {
        return;
      }

      affinity.set(normalized, (affinity.get(normalized) ?? 0) + normalizedSimilarity);
    });
  });

  return affinity;
}

export function suggestTags(entry: CorpusEntry, corpusEntries: CorpusEntry[]) {
  const normalizedCurrentTags = new Set(normalizeTags(entry.tags));
  const fields = extractSearchableEntry(entry);
  const tokenWeights = buildDraftTokenWeights(fields);
  const corpusAffinity = buildCorpusTagAffinity(entry, corpusEntries, tokenWeights);

  return collectDynamicCandidates(entry, corpusEntries)
    .filter((tag) => !normalizedCurrentTags.has(tag))
    .map((tag) => ({
      tag,
      score: scoreDirectMatches(tag, fields, tokenWeights) + (corpusAffinity.get(tag) ?? 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.tag.localeCompare(right.tag))
    .slice(0, TOP_SUGGESTION_COUNT)
    .map(({ tag }) => tag);
}
