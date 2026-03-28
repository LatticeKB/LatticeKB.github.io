import type { CorpusEntry } from '../../corpus/model/types';
import { extractSearchableEntry } from '../../search/lib/extractSearchText';
import { normalizeTags } from './normalizeTags';

const tokenPattern = /[a-z0-9][a-z0-9-]+/g;
const TOP_SUGGESTION_COUNT = 5;
const MAX_RELATED_ENTRIES = 12;
const MIN_DIRECT_EVIDENCE_SCORE = 3;
const MIN_FINAL_SCORE = 6;
const fieldWeights = {
  title: 6,
  aliases: 5,
  summary: 3,
  product: 3,
  category: 3,
  bodyText: 1,
  imageCaptions: 1,
} as const;

type DraftFields = ReturnType<typeof extractSearchableEntry>;
type WeightedFieldName = keyof typeof fieldWeights;
type WeightedField = {
  name: WeightedFieldName;
  text: string;
  weight: number;
};

type RelatedEntry = {
  entry: CorpusEntry;
  similarity: number;
};

function tokenize(value: string) {
  return value.toLowerCase().match(tokenPattern) ?? [];
}

function normalizeCandidate(rawTag: string) {
  return normalizeTags([rawTag])[0] ?? null;
}

function buildWeightedFields(fields: DraftFields): WeightedField[] {
  return [
    { name: 'title', text: fields.title, weight: fieldWeights.title },
    { name: 'aliases', text: fields.aliases, weight: fieldWeights.aliases },
    { name: 'summary', text: fields.summary, weight: fieldWeights.summary },
    { name: 'product', text: fields.product, weight: fieldWeights.product },
    { name: 'category', text: fields.category, weight: fieldWeights.category },
    { name: 'bodyText', text: fields.bodyText, weight: fieldWeights.bodyText },
    { name: 'imageCaptions', text: fields.imageCaptions, weight: fieldWeights.imageCaptions },
  ];
}

function buildDraftTokenWeights(weightedFields: WeightedField[]) {
  const counts = new Map<string, number>();

  weightedFields.forEach(({ text, weight }) => {
    tokenize(text).forEach((token) => {
      counts.set(token, (counts.get(token) ?? 0) + weight);
    });
  });

  return counts;
}

function scoreDirectEvidence(tag: string, weightedFields: WeightedField[], tokenWeights: Map<string, number>) {
  const tagTokens = tokenize(tag);
  if (tagTokens.length === 0) {
    return 0;
  }

  const loweredTag = tag.toLowerCase();
  let score = 0;
  let matchedTokenCount = 0;

  tagTokens.forEach((token) => {
    const tokenScore = tokenWeights.get(token) ?? 0;
    if (tokenScore > 0) {
      matchedTokenCount += 1;
      score += tokenScore;
    }
  });

  weightedFields.forEach(({ text, weight, name }) => {
    const loweredText = text.toLowerCase();
    if (loweredText.includes(loweredTag)) {
      score += weight * (name === 'title' || name === 'aliases' ? 4 : 3);
      matchedTokenCount = tagTokens.length;
      return;
    }

    if (tagTokens.length > 1 && tagTokens.every((token) => loweredText.includes(token))) {
      score += weight * 2;
      matchedTokenCount = Math.max(matchedTokenCount, tagTokens.length - 1);
    }
  });

  const coverage = matchedTokenCount / tagTokens.length;
  if (coverage === 0) {
    return 0;
  }

  return (score / tagTokens.length) * (0.6 + coverage);
}

function scoreEntrySimilarity(entry: CorpusEntry, draftTokenWeights: Map<string, number>) {
  const searchableEntry = extractSearchableEntry(entry);
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
    return 0;
  }

  let similarity = 0;
  entryTokens.forEach((token) => {
    similarity += draftTokenWeights.get(token) ?? 0;
  });

  if (similarity === 0) {
    return 0;
  }

  return similarity / Math.sqrt(entryTokens.size);
}

function findRelatedEntries(entry: CorpusEntry, corpusEntries: CorpusEntry[], draftTokenWeights: Map<string, number>) {
  return corpusEntries
    .filter((candidateEntry) => candidateEntry.id !== entry.id && candidateEntry.tags.length > 0)
    .map((candidateEntry) => ({
      entry: candidateEntry,
      similarity: scoreEntrySimilarity(candidateEntry, draftTokenWeights),
    }))
    .filter((candidate): candidate is RelatedEntry => candidate.similarity > 0)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, MAX_RELATED_ENTRIES);
}

function collectCandidates(entry: CorpusEntry, relatedEntries: RelatedEntry[]) {
  const candidates = new Set<string>();

  relatedEntries.forEach(({ entry: relatedEntry }) => {
    relatedEntry.tags.forEach((tag) => {
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

function buildTagDocumentFrequency(corpusEntries: CorpusEntry[]) {
  const documentFrequency = new Map<string, number>();

  corpusEntries.forEach((entry) => {
    const entryTags = new Set(normalizeTags(entry.tags));
    entryTags.forEach((tag) => {
      documentFrequency.set(tag, (documentFrequency.get(tag) ?? 0) + 1);
    });
  });

  return documentFrequency;
}

function scoreCorpusBoost(tag: string, relatedEntries: RelatedEntry[]) {
  let score = 0;

  relatedEntries.forEach(({ entry, similarity }, index) => {
    if (!entry.tags.some((existingTag) => normalizeCandidate(existingTag) === tag)) {
      return;
    }

    score += similarity / (1 + index * 0.35);
  });

  return score;
}

function scoreGenericPenalty(tag: string, documentFrequency: Map<string, number>, corpusSize: number) {
  if (corpusSize <= 1) {
    return 0;
  }

  const frequency = documentFrequency.get(tag) ?? 0;
  const ratio = frequency / corpusSize;
  if (ratio <= 0.2) {
    return 0;
  }

  return ratio * 8;
}

export function suggestTags(entry: CorpusEntry, corpusEntries: CorpusEntry[]) {
  const normalizedCurrentTags = new Set(normalizeTags(entry.tags));
  const fields = extractSearchableEntry(entry);
  const weightedFields = buildWeightedFields(fields);
  const draftTokenWeights = buildDraftTokenWeights(weightedFields);
  const relatedEntries = findRelatedEntries(entry, corpusEntries, draftTokenWeights);
  const documentFrequency = buildTagDocumentFrequency(corpusEntries);

  return collectCandidates(entry, relatedEntries)
    .filter((tag) => !normalizedCurrentTags.has(tag))
    .map((tag) => {
      const directEvidenceScore = scoreDirectEvidence(tag, weightedFields, draftTokenWeights);
      if (directEvidenceScore < MIN_DIRECT_EVIDENCE_SCORE) {
        return null;
      }

      const corpusBoost = scoreCorpusBoost(tag, relatedEntries);
      const genericPenalty = scoreGenericPenalty(tag, documentFrequency, corpusEntries.length);
      const finalScore = directEvidenceScore + corpusBoost - genericPenalty;

      if (finalScore < MIN_FINAL_SCORE) {
        return null;
      }

      return {
        tag,
        score: finalScore,
      };
    })
    .filter((candidate): candidate is { tag: string; score: number } => candidate !== null)
    .sort((left, right) => right.score - left.score || left.tag.localeCompare(right.tag))
    .slice(0, TOP_SUGGESTION_COUNT)
    .map(({ tag }) => tag);
}
