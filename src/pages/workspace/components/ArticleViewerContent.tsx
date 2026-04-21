import type { ClipboardEvent as ReactClipboardEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { FileDown } from 'lucide-react';
import { useCreateBlockNote } from '@blocknote/react';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { hasImageBlocks } from '../../../features/images/lib/imageBlockHelpers';
import { cn } from '../../../shared/lib/classes';
import { formatAbsoluteDate } from '../../../shared/lib/dates';
import { logAction, logError } from '../../../shared/lib/clientLogger';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { ArticleBody } from './ArticleBody';
import { ArticlePdfDocument } from './ArticlePdfDocument';

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

function createPdfFilename(title: string) {
  const safeBaseName = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'article';

  return `${safeBaseName}.pdf`;
}

export function ArticleViewerContent({ entry, actions, className }: Props) {
  const [pdfPromptOpen, setPdfPromptOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const copyTargetRef = useRef<HTMLDivElement | null>(null);
  const pdfExportRef = useRef<HTMLDivElement | null>(null);
  const hasInlineImages = hasImageBlocks(entry.body.blocks);
  const editor = useCreateBlockNote(
    {
      initialContent: entry.body.blocks,
      defaultStyles: false,
    },
    [entry.id, entry.updatedAt, entry.body.blocks],
  );

  function closePdfPrompt() {
    if (isGeneratingPdf) {
      return;
    }

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

  async function handleDownloadPdf() {
    if (!pdfExportRef.current) {
      setErrorMessage('The article PDF layout is not ready yet. Please try again.');
      return;
    }

    setIsGeneratingPdf(true);
    setErrorMessage(null);

    try {
      await document.fonts.ready;
      const exportRoot = pdfExportRef.current;
      const { default: html2pdf } = await import('html2pdf.js');
      const pdfOptions = {
        margin: [0.35, 0.35, 0.45, 0.35],
        filename: createPdfFilename(entry.title),
        image: { type: 'jpeg', quality: 0.98 },
        enableLinks: true,
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['.article-pdf-avoid-break', 'img', 'figure'],
        },
        html2canvas: {
          scale: Math.min(window.devicePixelRatio || 1, 2),
          useCORS: true,
          backgroundColor: '#f8fafc',
          windowWidth: exportRoot.scrollWidth,
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait' as const,
        },
      };
      const worker = (html2pdf as any)()
        .set(pdfOptions)
        .from(exportRoot);

      await worker.save();

      logAction('workspace.article.pdf_downloaded', {
        entryId: entry.id,
        title: entry.title,
        includesImages: hasInlineImages,
      });
      setPdfPromptOpen(false);
    } catch (error) {
      logError('workspace.article.pdf_download_failed', error, {
        entryId: entry.id,
        title: entry.title,
      });
      setErrorMessage(error instanceof Error ? error.message : 'Unable to generate the article PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
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

      <ArticlePdfDocument ref={pdfExportRef} entry={entry} />

      <Modal
        open={pdfPromptOpen}
        onClose={closePdfPrompt}
        title="Download article PDF"
        description="Embedded images do not survive cross-app copy reliably yet. Download a PDF instead."
        size="compact"
      >
        <div className="space-y-5 px-4 py-5 sm:px-6">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-muted">
            <p>
              This appears only when your current selection includes embedded media from the read-only preview. The downloaded PDF preserves the article title, body, inline images, and clickable links.
            </p>
          </div>

          {errorMessage ? <p className="text-sm leading-6 text-rose-200">{errorMessage}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/8 pt-4">
            <Button variant="ghost" onClick={closePdfPrompt} disabled={isGeneratingPdf}>
              Cancel
            </Button>
            <Button variant="solid" onClick={() => void handleDownloadPdf()} disabled={isGeneratingPdf}>
              <FileDown size={16} />
              {isGeneratingPdf ? 'Generating PDF…' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}