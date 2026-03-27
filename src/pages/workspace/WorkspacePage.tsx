import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { AppWindow, Upload } from 'lucide-react';
import { TopBar } from '../../app/layout/TopBar';
import { WorkspaceLayout } from '../../app/layout/WorkspaceLayout';
import { openArticleInNewTab } from '../../features/corpus/lib/openArticleInNewTab';
import { StatePanel } from '../../shared/ui/StatePanel';
import { Button } from '../../shared/ui/Button';
import { FiltersBar } from './components/FiltersBar';
import { ArticleViewerModal } from './components/ArticleViewerModal';
import { CorpusSyncBanner } from './components/CorpusSyncBanner';
import { PreviewPane } from './components/PreviewPane';
import { ResultList } from './components/ResultList';
import { SearchSection } from './components/SearchSection';
import { useWorkspaceController } from './useWorkspaceController';

const EditorModal = lazy(async () => import('../editor/EditorModal').then((module) => ({ default: module.EditorModal })));
const ScratchpadModal = lazy(async () => import('../scratchpad/ScratchpadModal').then((module) => ({ default: module.ScratchpadModal })));

export function WorkspacePage() {
  const controller = useWorkspaceController();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
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
  const previewEntry = controller.workspaceReady
    ? (hoveredEntryId
        ? resultMap.get(hoveredEntryId) ?? controller.corpus.entries.find((item) => item.id === hoveredEntryId) ?? controller.selectedEntry
        : controller.selectedEntry)
    : null;

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
        onOpenScratchpad={() => setScratchpadOpen(true)}
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
              <StatePanel variant="error" title="Workspace issue" detail={controller.errorMessage} />
            ) : null}

            {!controller.workspaceReady ? (
              <StatePanel centered>Restoring the last browser workspace…</StatePanel>
            ) : (
              <>
                {controller.hasUnsyncedCorpusChanges ? (
                  <CorpusSyncBanner syncState={controller.corpusSyncState} onDownload={controller.downloadCorpus} />
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
                  <StatePanel centered>
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="text-teal" size={20} />
                      <div>
                        <p className="font-medium text-soft-linen">Drop corpus.json to replace the current workspace</p>
                        <p className="mt-1 text-muted">Schema is validated locally before the in-browser index is rebuilt.</p>
                      </div>
                    </div>
                  </StatePanel>
                ) : null}

                {!dragging && controller.corpus.entries.length === 0 ? (
                  <StatePanel centered>
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
                  </StatePanel>
                ) : (
                  <ResultList
                    results={controller.results}
                    selectedEntryId={hoveredEntryId ?? controller.selectedEntryId}
                    onOpenArticle={openResultArticle}
                    onHoverArticle={setHoveredEntryId}
                    onTogglePinned={controller.togglePinned}
                  />
                )}
              </>
            )}
          </section>
        </WorkspaceLayout>

        <footer className="mx-auto mt-8 w-full max-w-[1480px] px-5 pb-8 text-xs text-muted sm:px-6 lg:px-8">
          <p>
            ©{' '}
            2026{' '}
            <a
              href="https://equiweb.github.io"
              target="_blank"
              rel="noreferrer noopener"
              className="text-soft-linen underline decoration-white/20 underline-offset-4 transition hover:text-teal hover:decoration-teal/40"
            >
              EquiWeb
            </a>{' '}
            All Rights Reserved
          </p>
        </footer>
      </div>
      <ArticleViewerModal
        open={controller.viewerSession.open}
        entry={controller.viewerSession.entry}
        onClose={controller.closeViewer}
        onEdit={controller.openEditArticle}
        onOpenInNewTab={openArticleInNewTab}
      />

      <Suspense fallback={null}>
        <ScratchpadModal key={scratchpadOpen ? 'open' : 'closed'} open={scratchpadOpen} onClose={() => setScratchpadOpen(false)} />
        <EditorModal
          key={`${controller.editorSession.mode}-${controller.editorSession.entry?.id ?? 'none'}-${controller.editorSession.open ? 'open' : 'closed'}`}
          session={controller.editorSession}
          corpusEntries={controller.corpus.entries}
          onClose={controller.closeEditor}
          onSave={controller.saveEntry}
          onDelete={controller.deleteEntry}
          productOptions={metadataOptions.products}
          categoryOptions={metadataOptions.categories}
        />
      </Suspense>
    </div>
  );
}
