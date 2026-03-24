import { z } from 'zod';
import { corpusEntrySchema } from '../model/schema';
import type { CorpusEntry } from '../model/types';

const ARTICLE_PREVIEW_QUERY_PARAM = 'articlePreview';
const ARTICLE_PREVIEW_STORAGE_PREFIX = 'latticekb:article-preview:';
const ARTICLE_PREVIEW_TTL_MS = 1000 * 60 * 60 * 24;

const storedArticlePreviewSchema = z.object({
  savedAt: z.string().datetime({ offset: true }),
  entry: corpusEntrySchema,
});

function isArticlePreviewStorageKey(key: string) {
  return key.startsWith(ARTICLE_PREVIEW_STORAGE_PREFIX);
}

function pruneExpiredArticlePreviews(storage: Storage) {
  const now = Date.now();

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (!key || !isArticlePreviewStorageKey(key)) {
      continue;
    }

    const raw = storage.getItem(key);
    if (!raw) {
      storage.removeItem(key);
      continue;
    }

    try {
      const preview = storedArticlePreviewSchema.parse(JSON.parse(raw));
      const age = now - Date.parse(preview.savedAt);
      if (Number.isNaN(age) || age > ARTICLE_PREVIEW_TTL_MS) {
        storage.removeItem(key);
      }
    } catch {
      storage.removeItem(key);
    }
  }
}

function buildArticlePreviewUrl(storageKey: string) {
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set(ARTICLE_PREVIEW_QUERY_PARAM, storageKey);
  return url.toString();
}

export function getArticlePreviewStorageKey(locationSearch = window.location.search) {
  return new URLSearchParams(locationSearch).get(ARTICLE_PREVIEW_QUERY_PARAM);
}

export function readStoredArticlePreview(storageKey: string) {
  try {
    pruneExpiredArticlePreviews(localStorage);
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    return storedArticlePreviewSchema.parse(JSON.parse(raw)).entry;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export function openArticleInNewTab(entry: CorpusEntry) {
  pruneExpiredArticlePreviews(localStorage);

  const storageKey = `${ARTICLE_PREVIEW_STORAGE_PREFIX}${entry.id}:${entry.updatedAt}`;
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      savedAt: new Date().toISOString(),
      entry,
    }),
  );

  window.open(buildArticlePreviewUrl(storageKey), '_blank', 'noopener,noreferrer');
}
