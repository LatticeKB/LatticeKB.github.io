import type { ReactNode } from 'react';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { formatAbsoluteDate } from '../../../shared/lib/dates';
import { cn } from '../../../shared/lib/classes';
import { ArticleBody } from './ArticleBody';

type Props = {
  entry: CorpusEntry;
  actions?: ReactNode;
  className?: string;
};

export function ArticleViewerContent({ entry, actions, className }: Props) {
  return (
    <div className={cn('mx-auto max-w-4xl', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {entry.product} / {entry.category}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-soft-linen sm:text-4xl">{entry.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{entry.summary || 'No summary recorded for this article.'}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full border border-white/8 px-2.5 py-1">Updated {formatAbsoluteDate(entry.updatedAt)}</span>
        {entry.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/8 px-2.5 py-1 text-soft-linen">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-8">
        <ArticleBody entry={entry} />
      </div>
    </div>
  );
}
