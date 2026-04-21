import { forwardRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { formatAbsoluteDate } from '../../../shared/lib/dates';
import { ArticleBody } from './ArticleBody';

type Props = {
  entry: CorpusEntry;
};

export const ArticlePdfDocument = forwardRef<HTMLDivElement, Props>(function ArticlePdfDocument({ entry }, ref) {
  const editor = useCreateBlockNote(
    {
      initialContent: entry.body.blocks,
      defaultStyles: false,
    },
    [entry.id, entry.updatedAt, entry.body.blocks],
  );

  return (
    <div ref={ref} className="article-pdf-export-root" aria-hidden="true">
      <article
        className="article-pdf-document overflow-hidden rounded-[28px]"
        style={{
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 24px 70px rgba(15, 23, 42, 0.08)',
        }}
      >
        <header className="article-pdf-avoid-break px-8 py-8" style={{ borderBottom: '1px solid #cbd5e1' }}>
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: '#64748b' }}
          >
            {entry.product} / {entry.category}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]" style={{ color: '#020617' }}>{entry.title}</h1>
          {entry.summary ? (
            <p className="mt-4 max-w-3xl text-base leading-7" style={{ color: '#475569' }}>
              {entry.summary}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs" style={{ color: '#64748b' }}>
            <span
              className="rounded-full px-3 py-1"
              style={{ border: '1px solid #cbd5e1' }}
            >
              Updated {formatAbsoluteDate(entry.updatedAt)}
            </span>
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1"
                style={{ border: '1px solid #cbd5e1', color: '#334155' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <ArticleBody entry={entry} editor={editor} appearance="document" className="article-pdf-avoid-break shadow-none" />
        </div>
      </article>
    </div>
  );
});
