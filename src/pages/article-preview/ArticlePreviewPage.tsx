import type { CorpusEntry } from '../../features/corpus/model/types';
import { StatePanel } from '../../shared/ui/StatePanel';
import { ArticleViewerContent } from '../workspace/components/ArticleViewerContent';

type Props = {
  entry: CorpusEntry | null;
};

export function ArticlePreviewPage({ entry }: Props) {
  return (
    <div className="min-h-screen px-5 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1080px]">
        <header className="rounded-[28px] border border-white/8 bg-black/14 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">LatticeKB / Article preview</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-soft-linen">Read-only preview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            This tab shows a snapshot of the article body using the same BlockNote read-only renderer as the in-app preview.
          </p>
        </header>

        <main className="mt-6 rounded-[32px] border border-white/8 bg-panel/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-6 lg:p-8">
          {entry ? (
            <ArticleViewerContent entry={entry} />
          ) : (
            <StatePanel
              title="Preview unavailable"
              detail="This preview snapshot is missing or expired. Re-open the article from the workspace to generate a fresh read-only tab."
              variant="error"
            />
          )}
        </main>
      </div>
    </div>
  );
}
