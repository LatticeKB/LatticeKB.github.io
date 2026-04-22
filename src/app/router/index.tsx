import { AppShell } from '../AppShell';
import { isArticlePreviewRequest, isArticlePrintRequest, resolveArticlePreviewEntry } from '../../features/corpus/lib/openArticleInNewTab';
import { ArticlePreviewPage } from '../../pages/article-preview/ArticlePreviewPage';
import { ArticlePrintPage } from '../../pages/article-preview/ArticlePrintPage';
import { WorkspacePage } from '../../pages/workspace/WorkspacePage';

export function AppRouter() {
  const previewEntry = resolveArticlePreviewEntry();

  if (isArticlePrintRequest()) {
    return <ArticlePrintPage entry={previewEntry} />;
  }

  return <AppShell>{isArticlePreviewRequest() ? <ArticlePreviewPage entry={previewEntry} /> : <WorkspacePage />}</AppShell>;
}
