import { z } from 'zod';
import { logAction, logWarning } from '../../../shared/lib/clientLogger';
import { removeImageBlocks } from '../../images/lib/imageBlockHelpers';
import { corpusEntrySchema } from '../model/schema';
import type { CorpusEntry } from '../model/types';

const ARTICLE_PREVIEW_QUERY_PARAM = 'articlePreview';
const SHARED_ARTICLE_QUERY_PARAM = 'sharedArticle';
const ARTICLE_PRINT_QUERY_PARAM = 'articlePrint';
const ARTICLE_PREVIEW_STORAGE_PREFIX = 'latticekb:article-preview:';
const ARTICLE_PREVIEW_TTL_MS = 1000 * 60 * 60 * 24;
const MAX_SHARE_URL_LENGTH = 2083;

const storedArticlePreviewSchema = z.object({
  savedAt: z.string().datetime({ offset: true }),
  entry: corpusEntrySchema,
});

function isArticlePreviewStorageKey(key: string) {
  return key.startsWith(ARTICLE_PREVIEW_STORAGE_PREFIX);
}

function bytesToBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
}

function encodeSharedArticlePreview(entry: CorpusEntry) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(entry)));
}

function decodeSharedArticlePreview(value: string) {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(value));
    return corpusEntrySchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
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

function buildArticleUrl(params: Record<string, string>) {
  const url = new URL(window.location.pathname, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function persistArticlePreview(entry: CorpusEntry) {
  pruneExpiredArticlePreviews(localStorage);

  const storageKey = `${ARTICLE_PREVIEW_STORAGE_PREFIX}${entry.id}:${entry.updatedAt}`;
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      savedAt: new Date().toISOString(),
      entry,
    }),
  );

  return storageKey;
}

function buildArticlePreviewUrl(storageKey: string) {
  return buildArticleUrl({ [ARTICLE_PREVIEW_QUERY_PARAM]: storageKey });
}

function buildArticlePrintUrl(storageKey: string) {
  return buildArticleUrl({
    [ARTICLE_PREVIEW_QUERY_PARAM]: storageKey,
    [ARTICLE_PRINT_QUERY_PARAM]: '1',
  });
}

export type ShareArticleLinkPlan =
  | {
      kind: 'ready';
      url: string;
      urlLength: number;
    }
  | {
      kind: 'fallback';
      fullUrlLength: number;
      fallbackUrl: string;
      fallbackUrlLength: number;
      removedImageCount: number;
    }
  | {
      kind: 'unavailable';
      fullUrlLength: number;
      fallbackUrlLength: number | null;
      removedImageCount: number;
    };

function stripImagesForShare(entry: CorpusEntry) {
  const strippedBody = removeImageBlocks(entry.body.blocks);
  return {
    entry: {
      ...entry,
      body: {
        ...entry.body,
        blocks: strippedBody.blocks,
      },
    },
    removedImageCount: strippedBody.removedCount,
  };
}

export function createShareArticleLinkPlan(entry: CorpusEntry): ShareArticleLinkPlan {
  const fullUrl = buildArticleUrl({ [SHARED_ARTICLE_QUERY_PARAM]: encodeSharedArticlePreview(entry) });
  if (fullUrl.length <= MAX_SHARE_URL_LENGTH) {
    return {
      kind: 'ready',
      url: fullUrl,
      urlLength: fullUrl.length,
    };
  }

  const strippedShare = stripImagesForShare(entry);
  const fallbackUrl = strippedShare.removedImageCount > 0
    ? buildArticleUrl({ [SHARED_ARTICLE_QUERY_PARAM]: encodeSharedArticlePreview(strippedShare.entry) })
    : null;

  logWarning('workspace.article.share_link_too_long', {
    entryId: entry.id,
    title: entry.title,
    urlLength: fullUrl.length,
    maxLength: MAX_SHARE_URL_LENGTH,
    removedImageCount: strippedShare.removedImageCount,
    fallbackUrlLength: fallbackUrl?.length ?? null,
  });

  if (fallbackUrl && fallbackUrl.length <= MAX_SHARE_URL_LENGTH) {
    return {
      kind: 'fallback',
      fullUrlLength: fullUrl.length,
      fallbackUrl,
      fallbackUrlLength: fallbackUrl.length,
      removedImageCount: strippedShare.removedImageCount,
    };
  }

  return {
    kind: 'unavailable',
    fullUrlLength: fullUrl.length,
    fallbackUrlLength: fallbackUrl?.length ?? null,
    removedImageCount: strippedShare.removedImageCount,
  };
}

export function getArticlePreviewStorageKey(locationSearch = window.location.search) {
  return new URLSearchParams(locationSearch).get(ARTICLE_PREVIEW_QUERY_PARAM);
}

export function getSharedArticlePayload(locationSearch = window.location.search) {
  return new URLSearchParams(locationSearch).get(SHARED_ARTICLE_QUERY_PARAM);
}

export function isArticlePreviewRequest(locationSearch = window.location.search) {
  const searchParams = new URLSearchParams(locationSearch);
  return searchParams.has(ARTICLE_PREVIEW_QUERY_PARAM) || searchParams.has(SHARED_ARTICLE_QUERY_PARAM);
}

export function isArticlePrintRequest(locationSearch = window.location.search) {
  return new URLSearchParams(locationSearch).has(ARTICLE_PRINT_QUERY_PARAM);
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

export function readSharedArticlePreview(payload: string) {
  return decodeSharedArticlePreview(payload);
}

export function resolveArticlePreviewEntry(locationSearch = window.location.search) {
  const sharedPayload = getSharedArticlePayload(locationSearch);
  if (sharedPayload) {
    return readSharedArticlePreview(sharedPayload);
  }

  const storageKey = getArticlePreviewStorageKey(locationSearch);
  if (!storageKey) {
    return null;
  }

  return readStoredArticlePreview(storageKey);
}

export function openArticleInNewTab(entry: CorpusEntry) {
  const storageKey = persistArticlePreview(entry);

  logAction('workspace.article.open_in_new_tab', {
    entryId: entry.id,
    title: entry.title,
    storageKey,
  });

  window.open(buildArticlePreviewUrl(storageKey), '_blank', 'noopener,noreferrer');
}

export function openArticlePrintPreview(entry: CorpusEntry) {
  const storageKey = persistArticlePreview(entry);

  logAction('workspace.article.open_print_preview', {
    entryId: entry.id,
    title: entry.title,
    storageKey,
  });

  return window.open(buildArticlePrintUrl(storageKey), '_blank', 'noopener,noreferrer');
}
