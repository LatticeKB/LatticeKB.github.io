import { ExternalLink, FilePenLine, Image as ImageIcon, Pin } from 'lucide-react';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { formatAbsoluteDate } from '../../../shared/lib/dates';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { blocksToPlainText } from '../../../features/editor/lib/blockTransforms';
import { extractImageMetadata } from '../../../features/images/lib/imageBlockHelpers';

type Props = {
  entry: CorpusEntry | null;
  onOpenArticle: (entry: CorpusEntry) => void;
  onEdit: (entry: CorpusEntry) => void;
};

export function PreviewPane({ entry, onOpenArticle, onEdit }: Props) {
  if (!entry) {
    return <EmptyState>Select a result to inspect the article preview.</EmptyState>;
  }

  const plainText = blocksToPlainText(entry.body.blocks);
  const images = extractImageMetadata(entry.body.blocks);

  return (
    <section className="sticky top-4 rounded-[28px] border border-white/8 bg-black/14 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
            <span>{entry.product}</span>
            <span>/</span>
            <span>{entry.category}</span>
            {entry.pinned ? <Pin size={12} className="text-teal" /> : null}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-soft-linen">{entry.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{entry.summary || plainText.slice(0, 240) || 'No summary yet.'}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="solid" onClick={() => onOpenArticle(entry)}>
          <ExternalLink size={16} />
          Open article
        </Button>
        <Button onClick={() => onEdit(entry)}>
          <FilePenLine size={16} />
          Edit
        </Button>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/7 bg-white/[0.03] p-3">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Updated</dt>
          <dd className="mt-2 text-soft-linen">{formatAbsoluteDate(entry.updatedAt)}</dd>
        </div>
        <div className="rounded-2xl border border-white/7 bg-white/[0.03] p-3">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">State</dt>
          <dd className="mt-2 text-soft-linen">Local-only / browser memory</dd>
        </div>
      </dl>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.16em] text-muted">Tags</h3>
          {images.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <ImageIcon size={12} />
              {images.length} inline
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/8 px-2.5 py-1 text-xs text-soft-linen">
              {tag}
            </span>
          ))}
          {entry.tags.length === 0 ? <span className="text-sm text-muted">No tags</span> : null}
        </div>
      </div>

      <div className="mt-6 border-t border-white/8 pt-5">
        <h3 className="text-xs uppercase tracking-[0.16em] text-muted">Extract</h3>
        <p className="mt-3 text-sm leading-6 text-muted">{plainText || 'No document body yet.'}</p>
      </div>
    </section>
  );
}
