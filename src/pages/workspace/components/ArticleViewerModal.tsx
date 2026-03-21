import { ExternalLink, FilePenLine } from 'lucide-react';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { formatAbsoluteDate } from '../../../shared/lib/dates';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { ArticleBody } from './ArticleBody';

type Props = {
  entry: CorpusEntry | null;
  open: boolean;
  onClose: () => void;
  onEdit: (entry: CorpusEntry) => void;
  onOpenInNewTab: (entry: CorpusEntry) => void;
};

export function ArticleViewerModal({ entry, open, onClose, onEdit, onOpenInNewTab }: Props) {
  if (!open || !entry) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry.title}
      description="Read-only article view. Edit opens the document surface without leaving the workspace."
      className="h-[min(94vh,980px)]"
    >
      <div className="lattice-scrollbar h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">{entry.product} / {entry.category}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-soft-linen sm:text-4xl">{entry.title}</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{entry.summary || 'No summary recorded for this article.'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenInNewTab(entry)}>
                <ExternalLink size={16} />
                Open in new tab
              </Button>
              <Button variant="solid" onClick={() => onEdit(entry)}>
                <FilePenLine size={16} />
                Edit article
              </Button>
            </div>
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
      </div>
    </Modal>
  );
}
