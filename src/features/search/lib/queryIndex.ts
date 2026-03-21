import type { CorpusEntry } from '../../corpus/model/types';
import { truncateText } from '../../../shared/lib/strings';
import type { SearchFilters, SearchHit } from '../model/searchTypes';
import { filterHits, rankFallbackHits } from './ranking';
import type { CorpusIndex } from './buildIndex';
import { extractSearchableEntry } from './extractSearchText';

function buildFallbackHits(entries: CorpusEntry[]): SearchHit[] {
  return entries.map((entry) => ({
    entry,
    score: entry.pinned ? 1 : 0,
    matchText: truncateText(entry.summary || extractSearchableEntry(entry).bodyText, 180),
  }));
}

export function queryIndex(index: CorpusIndex, query: string, filters: SearchFilters) {
  const normalizedQuery = query.trim();
  const allEntries = Array.from(index.entryMap.values());

  if (!normalizedQuery) {
    return filterHits(rankFallbackHits(buildFallbackHits(allEntries)), filters);
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
      if (!entry) {
        return null;
      }

      const bodyText = extractSearchableEntry(entry).bodyText;
      return {
        entry,
        score: match.score,
        matchText: truncateText(entry.summary || bodyText, 180),
      } satisfies SearchHit;
    })
    .filter((value): value is SearchHit => value !== null);

  return filterHits(hits, filters);
}
