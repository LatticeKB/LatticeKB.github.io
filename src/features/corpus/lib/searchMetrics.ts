import type { CorpusFile, SearchMetricEntry, SearchMetrics } from '../model/types';

export const ARTICLE_TELEMETRY_CHANNEL = 'latticekb:article-telemetry';
export const MINIMUM_RECORDED_SESSION_MS = 1_000;
export const SHORT_ABANDON_THRESHOLD_MS = 8_000;
export const QUALIFIED_VIEW_THRESHOLD_MS = 10_000;
export const LONG_VIEW_THRESHOLD_MS = 60_000;

export type ArticleReadSession = {
  visibleDwellMs: number;
  completedAt: string;
};

export type ArticleTelemetryMessage =
  | {
      type: 'session';
      corpusName: string;
      entryId: string;
      session: ArticleReadSession;
    };

export function createEmptySearchMetricEntry(): SearchMetricEntry {
  return {
    openCount: 0,
    qualifiedViewCount: 0,
    shortAbandonCount: 0,
    totalQualifiedDwellSeconds: 0,
    longViewCount: 0,
    lastViewedAt: undefined,
  };
}

export function createEmptySearchMetrics(): SearchMetrics {
  return {
    entries: {},
  };
}

export function normalizeSearchMetricEntry(candidate: Partial<SearchMetricEntry> | undefined): SearchMetricEntry {
  return {
    openCount: Math.max(0, Math.trunc(candidate?.openCount ?? 0)),
    qualifiedViewCount: Math.max(0, Math.trunc(candidate?.qualifiedViewCount ?? 0)),
    shortAbandonCount: Math.max(0, Math.trunc(candidate?.shortAbandonCount ?? 0)),
    totalQualifiedDwellSeconds: Math.max(0, Math.trunc(candidate?.totalQualifiedDwellSeconds ?? 0)),
    longViewCount: Math.max(0, Math.trunc(candidate?.longViewCount ?? 0)),
    lastViewedAt: typeof candidate?.lastViewedAt === 'string' && candidate.lastViewedAt ? candidate.lastViewedAt : undefined,
  };
}

export function normalizeSearchMetrics(searchMetrics: SearchMetrics | undefined, validEntryIds: Iterable<string>): SearchMetrics {
  const allowedIds = new Set(validEntryIds);
  const normalizedEntries = Object.entries(searchMetrics?.entries ?? {}).reduce<Record<string, SearchMetricEntry>>((accumulator, [entryId, metrics]) => {
    if (!allowedIds.has(entryId)) {
      return accumulator;
    }

    accumulator[entryId] = normalizeSearchMetricEntry(metrics);
    return accumulator;
  }, {});

  return {
    entries: normalizedEntries,
  };
}

function hasEntry(corpus: CorpusFile, entryId: string) {
  return corpus.entries.some((entry) => entry.id === entryId);
}

function updateEntryMetrics(corpus: CorpusFile, entryId: string, updater: (metrics: SearchMetricEntry) => SearchMetricEntry): CorpusFile {
  if (!hasEntry(corpus, entryId)) {
    return corpus;
  }

  const currentMetrics = corpus.searchMetrics.entries[entryId] ?? createEmptySearchMetricEntry();
  return {
    ...corpus,
    searchMetrics: {
      entries: {
        ...corpus.searchMetrics.entries,
        [entryId]: updater(currentMetrics),
      },
    },
  };
}

export function recordArticleOpen(corpus: CorpusFile, entryId: string): CorpusFile {
  return updateEntryMetrics(corpus, entryId, (metrics) => ({
    ...metrics,
    openCount: metrics.openCount + 1,
  }));
}

export function recordArticleReadSession(corpus: CorpusFile, entryId: string, session: ArticleReadSession): CorpusFile {
  if (session.visibleDwellMs < MINIMUM_RECORDED_SESSION_MS) {
    return corpus;
  }

  return updateEntryMetrics(corpus, entryId, (metrics) => {
    const nextMetrics: SearchMetricEntry = {
      ...metrics,
      lastViewedAt: session.completedAt,
    };

    if (session.visibleDwellMs < SHORT_ABANDON_THRESHOLD_MS) {
      nextMetrics.shortAbandonCount += 1;
      return nextMetrics;
    }

    if (session.visibleDwellMs >= QUALIFIED_VIEW_THRESHOLD_MS) {
      nextMetrics.qualifiedViewCount += 1;
      nextMetrics.totalQualifiedDwellSeconds += Math.round(session.visibleDwellMs / 1_000);
    }

    if (session.visibleDwellMs >= LONG_VIEW_THRESHOLD_MS) {
      nextMetrics.longViewCount += 1;
    }

    return nextMetrics;
  });
}

export function isArticleTelemetryMessage(candidate: unknown): candidate is ArticleTelemetryMessage {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }

  const message = candidate as Partial<ArticleTelemetryMessage>;
  return message.type === 'session'
    && typeof message.corpusName === 'string'
    && typeof message.entryId === 'string'
    && typeof message.session === 'object'
    && message.session !== null
    && typeof message.session.visibleDwellMs === 'number'
    && typeof message.session.completedAt === 'string';
}
