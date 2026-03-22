import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { AppWindow, Upload } from 'lucide-react';
import { TopBar } from '../../app/layout/TopBar';
import { WorkspaceLayout } from '../../app/layout/WorkspaceLayout';
import { openArticleInNewTab } from '../../features/corpus/lib/openArticleInNewTab';
import { ErrorState } from '../../shared/ui/ErrorState';
import { EmptyState } from '../../shared/ui/EmptyState';
import { Button } from '../../shared/ui/Button';
import { FiltersBar } from './components/FiltersBar';
import { ArticleViewerModal } from './components/ArticleViewerModal';
import { PreviewPane } from './components/PreviewPane';
import { ResultList } from './components/ResultList';
import { SearchSection } from './components/SearchSection';
import { useWorkspaceController } from './useWorkspaceController';

const EditorModal = lazy(async () => import('../editor/EditorModal').then((module) => ({ default: module.EditorModal })));

export function WorkspacePage() {
  const controller = useWorkspaceController();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null);

  const resultMap = useMemo(
    () => new Map(controller.results.map((hit) => [hit.entry.id, hit.entry])),
    [controller.results],
  );
  const metadataOptions = useMemo(
    () => ({
      products: Array.from(new Set(controller.corpus.entries.map((entry) => entry.product).filter(Boolean))).sort(),
      categories: Array.from(new Set(controller.corpus.entries.map((entry) => entry.category).filter(Boolean))).sort(),
    }),
    [controller.corpus.entries],
  );
  const previewEntry = hoveredEntryId
    ? resultMap.get(hoveredEntryId) ?? controller.corpus.entries.find((item) => item.id === hoveredEntryId) ?? controller.selectedEntry
    : controller.selectedEntry;

  async function handleFileSelection(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    await controller.loadCorpusFromFile(file);
  }

  function openResultArticle(id: string) {
    const entry = resultMap.get(id) ?? controller.corpus.entries.find((item) => item.id === id) ?? null;
    if (!entry) {
      return;
    }

    controller.openArticle(entry);
  }

  return (
    <div className="pb-8">
      <TopBar
        corpusName={controller.corpusName}
        onLoadCorpus={() => fileInputRef.current?.click()}
        onNewArticle={controller.openNewArticle}
        onDownloadJson={controller.downloadCorpus}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => void handleFileSelection(event.target.files)}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFileSelection(event.dataTransfer.files);
        }}
      >
        <SearchSection
          query={controller.query}
          onQueryChange={controller.setQuery}
          onQuickQuery={controller.setQuery}
        />

        <WorkspaceLayout
          sidebar={
            <PreviewPane
              entry={previewEntry}
              onOpenArticle={controller.openArticle}
              onEdit={controller.openEditArticle}
              onTogglePinned={controller.togglePinned}
              onSearchTag={controller.setQuery}
            />
          }
        >
          <section className="space-y-5">
            {controller.errorMessage ? (
              <ErrorState title="Import failed" detail={controller.errorMessage} />
            ) : null}

            <div className="rounded-[28px] border border-white/8 bg-black/12 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Workspace</p>
                  <p className="mt-1 text-sm text-muted">
                    {controller.results.length} results from {controller.corpus.entries.length} articles.
                  </p>
                </div>
                <FiltersBar filters={controller.filters} onChange={controller.updateFilters} />
              </div>
            </div>

            {dragging ? (
              <EmptyState>
                <div className="flex flex-col items-center gap-3">
                  <Upload className="text-teal" size={20} />
                  <div>
                    <p className="font-medium text-soft-linen">Drop corpus.json to replace the current workspace</p>
                    <p className="mt-1 text-muted">Schema is validated locally before the in-browser index is rebuilt.</p>
                  </div>
                </div>
              </EmptyState>
            ) : null}

            {!dragging && controller.corpus.entries.length === 0 ? (
              <EmptyState>
                <div className="flex flex-col items-center gap-3">
                  <AppWindow size={20} className="text-teal" />
                  <div>
                    <p className="font-medium text-soft-linen">No articles loaded</p>
                    <p className="mt-1 text-muted">Load a corpus or create the first article directly in the browser.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => fileInputRef.current?.click()}>Load corpus</Button>
                    <Button variant="solid" onClick={controller.openNewArticle}>
                      New article
                    </Button>
                  </div>
                </div>
              </EmptyState>
            ) : (
              <ResultList
                results={controller.results}
                selectedEntryId={hoveredEntryId ?? controller.selectedEntryId}
                onOpenArticle={openResultArticle}
                onHoverArticle={setHoveredEntryId}
                onTogglePinned={controller.togglePinned}
              />
            )}
          </section>
        </WorkspaceLayout>
      </div>
      <ArticleViewerModal
        open={controller.viewerSession.open}
        entry={controller.viewerSession.entry}
        onClose={controller.closeViewer}
        onEdit={controller.openEditArticle}
        onOpenInNewTab={openArticleInNewTab}
      />

      <Suspense fallback={null}>
        <EditorModal
          key={`${controller.editorSession.mode}-${controller.editorSession.entry?.id ?? 'none'}-${controller.editorSession.open ? 'open' : 'closed'}`}
          session={controller.editorSession}
          onClose={controller.closeEditor}
          onSave={controller.saveEntry}
          productOptions={metadataOptions.products}
          categoryOptions={metadataOptions.categories}
        />
      </Suspense>
    </div>
  );
}
