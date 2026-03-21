import type { SearchFilters, SearchHit } from '../model/searchTypes';
import { hasImageBlocks } from '../../images/lib/imageBlockHelpers';

const RECENT_WINDOW_DAYS = 30;

function isRecent(updatedAt: string) {
  const updated = new Date(updatedAt).getTime();
  return Date.now() - updated < RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function filterHits(hits: SearchHit[], filters: SearchFilters) {
  return hits.filter(({ entry }) => {
    if (filters.pinnedOnly && !entry.pinned) {
      return false;
    }

    if (filters.recentOnly && !isRecent(entry.updatedAt)) {
      return false;
    }

    if (filters.hasImages && !hasImageBlocks(entry.body.blocks)) {
      return false;
    }

    return true;
  });
}

export function rankFallbackHits(entries: SearchHit[]) {
  return [...entries].sort((left, right) => {
    if (left.entry.pinned !== right.entry.pinned) {
      return Number(right.entry.pinned) - Number(left.entry.pinned);
    }

    return new Date(right.entry.updatedAt).getTime() - new Date(left.entry.updatedAt).getTime();
  });
}
