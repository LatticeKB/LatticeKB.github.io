import { ExternalLink, FilePenLine } from 'lucide-react';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { ArticleViewerContent } from './ArticleViewerContent';

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
        <ArticleViewerContent
          entry={entry}
          actions={
            <>
              <Button variant="ghost" onClick={() => onOpenInNewTab(entry)}>
                <ExternalLink size={16} />
                Open in new tab
              </Button>
              <Button variant="solid" onClick={() => onEdit(entry)}>
                <FilePenLine size={16} />
                Edit article
              </Button>
            </>
          }
        />
      </div>
    </Modal>
  );
}
