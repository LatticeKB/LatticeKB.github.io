import { truncateText } from '../../../shared/lib/strings';
import type { SearchFilters, SearchHit } from '../model/searchTypes';
import type { CorpusIndex } from './buildIndex';

const RECENT_WINDOW_DAYS = 30;

function isRecent(updatedAt: string) {
  const updated = new Date(updatedAt).getTime();
  return Date.now() - updated < RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function filterHits(hits: SearchHit[], filters: SearchFilters, imageEntryIds: Set<string>) {
  return hits.filter(({ entry }) => {
    if (filters.pinnedOnly && !entry.pinned) {
      return false;
    }

    if (filters.recentOnly && !isRecent(entry.updatedAt)) {
      return false;
    }

    if (filters.hasImages && !imageEntryIds.has(entry.id)) {
      return false;
    }

    return true;
  });
}

export function queryIndex(index: CorpusIndex, query: string, filters: SearchFilters) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return filterHits(index.fallbackHits, filters, index.imageEntryIds);
  }

  const matches = index.miniSearch.search(normalizedQuery, {
    prefix: true,
    fuzzy: 0.2,
    combineWith: 'AND',
    boost: {
      title: 6,
      tags: 4,
      aliases: 4,
      summary: 3,
      imageCaptions: 2,
      bodyText: 1,
    },
  });

  const hits = matches
    .map((match) => {
      const entry = index.entryMap.get(match.id);
      const searchDoc = index.searchDocMap.get(match.id);
      if (!entry || !searchDoc) {
        return null;
      }

      return {
        entry,
        score: match.score,
        matchText: truncateText(entry.summary || searchDoc.bodyText, 180),
      } satisfies SearchHit;
    })
    .filter((value): value is SearchHit => value !== null);

  return filterHits(hits, filters, index.imageEntryIds);
}
