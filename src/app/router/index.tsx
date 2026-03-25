import { AppShell } from '../AppShell';
import { isArticlePreviewRequest, resolveArticlePreviewEntry } from '../../features/corpus/lib/openArticleInNewTab';
import { ArticlePreviewPage } from '../../pages/article-preview/ArticlePreviewPage';
import { WorkspacePage } from '../../pages/workspace/WorkspacePage';

export function AppRouter() {
  const previewEntry = resolveArticlePreviewEntry();

  return <AppShell>{isArticlePreviewRequest() ? <ArticlePreviewPage entry={previewEntry} /> : <WorkspacePage />}</AppShell>;
}
