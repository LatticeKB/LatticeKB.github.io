import type { ClipboardEvent as ReactClipboardEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { FileDown } from 'lucide-react';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { openArticlePrintPreview } from '../../../features/corpus/lib/openArticleInNewTab';
import { hasImageBlocks } from '../../../features/images/lib/imageBlockHelpers';
import { cn } from '../../../shared/lib/classes';
import { formatAbsoluteDate } from '../../../shared/lib/dates';
import { logAction } from '../../../shared/lib/clientLogger';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { ArticleBody } from './ArticleBody';

type Props = {
  entry: CorpusEntry;
  actions?: ReactNode;
  className?: string;
};

function selectionTouchesInlineImage(selection: Selection, container: HTMLElement) {
  for (let index = 0; index < selection.rangeCount; index += 1) {
    const range = selection.getRangeAt(index);
    if (!range.intersectsNode(container)) {
      continue;
    }

    const fragment = range.cloneContents();
    if (fragment.querySelector('img')) {
      return true;
    }
  }

  return false;
}

export function ArticleViewerContent({ entry, actions, className }: Props) {
  const [pdfPromptOpen, setPdfPromptOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const copyTargetRef = useRef<HTMLDivElement | null>(null);
  const hasInlineImages = hasImageBlocks(entry.body.blocks);
  const editor = useCreateBlockNote(
    {
      initialContent: entry.body.blocks,
      defaultStyles: false,
    },
    [entry.id, entry.updatedAt, entry.body.blocks],
  );

  function closePdfPrompt() {
    setPdfPromptOpen(false);
    setErrorMessage(null);
  }

  function handleArticleCopyIntent(event: ReactClipboardEvent<HTMLDivElement>) {
    if (!hasInlineImages || !copyTargetRef.current) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selectionTouchesInlineImage(selection, copyTargetRef.current)) {
      return;
    }

    event.preventDefault();
    setErrorMessage(null);
    setPdfPromptOpen(true);
    logAction('workspace.article.pdf_prompted', {
      entryId: entry.id,
      title: entry.title,
    });
  }

  function handleSaveAsPdf() {
    const printWindow = openArticlePrintPreview(entry);
    if (printWindow) {
      setPdfPromptOpen(false);
      setErrorMessage(null);
      return;
    }

    setErrorMessage('Allow pop-ups for this site so the print preview can open.');
  }

  return (
    <>
      <div ref={copyTargetRef} onCopyCapture={handleArticleCopyIntent} className={cn('mx-auto max-w-4xl', className)}>
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
          <ArticleBody entry={entry} editor={editor} />
        </div>
      </div>

      <Modal
        open={pdfPromptOpen}
        onClose={closePdfPrompt}
        title="Save article as PDF"
        description="Embedded images do not survive cross-app copy reliably yet. Save a professionally formatted PDF instead."
        size="compact"
      >
        <div className="space-y-5 px-4 py-5 sm:px-6">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-muted">
            <p>
              This appears only when your current selection includes embedded media from the read-only preview. The PDF view preserves the article title, body, and inline images more reliably than clipboard paste.
            </p>
          </div>

          {errorMessage ? <p className="text-sm leading-6 text-rose-200">{errorMessage}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/8 pt-4">
            <Button variant="ghost" onClick={closePdfPrompt}>
              Cancel
            </Button>
            <Button variant="solid" onClick={handleSaveAsPdf}>
              <FileDown size={16} />
              Save as PDF
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}