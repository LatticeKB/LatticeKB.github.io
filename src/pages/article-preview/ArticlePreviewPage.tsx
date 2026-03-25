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
        <main className="rounded-[32px] border border-white/8 bg-panel/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-6 lg:p-8">
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
