import { Image as ImageIcon, Pin, Star } from 'lucide-react';
import type { SearchHit } from '../../../features/search/model/searchTypes';
import { formatRelativeDate } from '../../../shared/lib/dates';
import { cn } from '../../../shared/lib/classes';
import { extractImageMetadata } from '../../../features/images/lib/imageBlockHelpers';
import { Button } from '../../../shared/ui/Button';

type Props = {
  hit: SearchHit;
  active: boolean;
  onOpen: () => void;
  onHover: () => void;
  onTogglePinned: () => void;
};

export function ResultRow({ hit, active, onOpen, onHover, onTogglePinned }: Props) {
  const imageCount = extractImageMetadata(hit.entry.body.blocks).length;

  return (
    <article
      className={cn(
        'rounded-3xl border px-4 py-4 transition duration-150 ease-quiet',
        active
          ? 'border-teal/40 bg-teal/10'
          : 'border-white/6 bg-white/[0.025] hover:border-white/12 hover:bg-white/[0.04]',
      )}
      onMouseEnter={onHover}
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
            <span>{hit.entry.product}</span>
            <span className="text-white/18">/</span>
            <span>{hit.entry.category}</span>
          </div>
          <h3 className="mt-2 text-[15px] font-medium text-soft-linen">{hit.entry.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{hit.matchText}</p>
        </button>
        <div className="flex flex-col items-end gap-3 text-xs text-muted">
          <Button
            variant={hit.entry.pinned ? 'solid' : 'ghost'}
            className="rounded-full p-2"
            aria-label={hit.entry.pinned ? 'Unpin article' : 'Pin article'}
            onClick={onTogglePinned}
          >
            <Pin size={14} className={hit.entry.pinned ? 'text-teal' : ''} />
          </Button>
          <span>{hit.score.toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full border border-white/8 px-2 py-1">{formatRelativeDate(hit.entry.updatedAt)}</span>
        {imageCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/8 px-2 py-1">
            <ImageIcon size={12} />
            {imageCount}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 rounded-full border border-white/8 px-2 py-1">
          <Star size={12} />
          {hit.entry.confidence}
        </span>
      </div>
    </article>
  );
}
