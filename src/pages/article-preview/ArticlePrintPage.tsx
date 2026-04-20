import { useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { Printer } from 'lucide-react';
import type { CorpusEntry } from '../../features/corpus/model/types';
import { formatAbsoluteDate } from '../../shared/lib/dates';
import { Button } from '../../shared/ui/Button';
import { StatePanel } from '../../shared/ui/StatePanel';
import { ArticleBody } from '../workspace/components/ArticleBody';

type Props = {
  entry: CorpusEntry | null;
};

export function ArticlePrintPage({ entry }: Props) {
  const editor = useCreateBlockNote(
    {
      initialContent: entry?.body.blocks ?? [],
      defaultStyles: false,
    },
    [entry?.id, entry?.updatedAt, entry?.body.blocks],
  );

  useEffect(() => {
    if (!entry) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => window.print(), 180);
    return () => window.clearTimeout(timeoutId);
  }, [entry]);

  if (!entry) {
    return (
      <div className="article-print-shell article-print-screen min-h-screen px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <StatePanel
            title="Print preview unavailable"
            detail="This article is missing or expired. Re-open it from the workspace before saving as PDF."
            variant="error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="article-print-shell min-h-screen bg-[#f3efe7] text-slate-900">
      <div className="article-print-screen border-b border-slate-300/80 bg-white/92 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Save article as PDF</p>
            <p className="mt-1 text-sm text-slate-600">Use your browser&apos;s destination picker to choose “Save as PDF”.</p>
          </div>
          <Button variant="solid" onClick={() => window.print()}>
            <Printer size={16} />
            Print again
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
        <article className="article-print-document mx-auto overflow-hidden rounded-[32px] border border-slate-300/80 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.12)] print:rounded-none print:border-0 print:shadow-none">
          <header className="border-b border-slate-200 px-7 py-8 sm:px-10 print:px-0 print:pt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {entry.product} / {entry.category}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{entry.title}</h1>
            {entry.summary ? <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{entry.summary}</p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-300 px-3 py-1">Updated {formatAbsoluteDate(entry.updatedAt)}</span>
              {entry.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-300 px-3 py-1 text-slate-700">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="px-5 py-6 sm:px-7 sm:py-7 print:px-0 print:py-6">
            <ArticleBody entry={entry} editor={editor} appearance="print" className="print:border-0 print:shadow-none" />
          </div>
        </article>
      </main>
    </div>
  );
}
