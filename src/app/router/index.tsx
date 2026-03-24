import { AppShell } from '../AppShell';
import { getArticlePreviewStorageKey, readStoredArticlePreview } from '../../features/corpus/lib/openArticleInNewTab';
import { ArticlePreviewPage } from '../../pages/article-preview/ArticlePreviewPage';
import { WorkspacePage } from '../../pages/workspace/WorkspacePage';

export function AppRouter() {
  const previewStorageKey = getArticlePreviewStorageKey();
  const previewEntry = previewStorageKey ? readStoredArticlePreview(previewStorageKey) : null;

  return <AppShell>{previewStorageKey ? <ArticlePreviewPage entry={previewEntry} /> : <WorkspacePage />}</AppShell>;
}
