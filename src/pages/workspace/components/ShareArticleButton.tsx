import { Check, ImageOff, Link2Off, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createShareArticleLinkPlan, type ShareArticleLinkPlan } from '../../../features/corpus/lib/openArticleInNewTab';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { logAction, logError } from '../../../shared/lib/clientLogger';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';

type Props = {
  entry: CorpusEntry;
};

const COPIED_RESET_MS = 2000;

function formatShareError(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to copy share link.';
}

function describeUnavailableShare(plan: Extract<ShareArticleLinkPlan, { kind: 'unavailable' }>) {
  if (plan.removedImageCount > 0) {
    return `Even after removing ${plan.removedImageCount} embedded image ${plan.removedImageCount === 1 ? 'block' : 'blocks'}, the share URL would still be too long for reliable browser support.`;
  }

  return 'This article is too large to fit into a reliable browser share URL, and there are no image blocks to strip out for a lighter version.';
}

export function ShareArticleButton({ entry }: Props) {
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sharePlan, setSharePlan] = useState<Extract<ShareArticleLinkPlan, { kind: 'fallback' | 'unavailable' }> | null>(null);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function copyShareUrl(url: string, variant: 'full' | 'without_images') {
    await navigator.clipboard.writeText(url);
    logAction('workspace.article.share_copied', {
      entryId: entry.id,
      title: entry.title,
      variant,
      urlLength: url.length,
    });
    setErrorMessage(null);
    setCopied(true);
  }

  async function handleShare() {
    logAction('workspace.article.share_requested', {
      entryId: entry.id,
      title: entry.title,
    });

    try {
      const nextSharePlan = createShareArticleLinkPlan(entry);
      if (nextSharePlan.kind === 'ready') {
        setSharePlan(null);
        await copyShareUrl(nextSharePlan.url, 'full');
        return;
      }

      setCopied(false);
      setErrorMessage(null);
      setSharePlan(nextSharePlan);
      logAction('workspace.article.share_fallback_prompted', {
        entryId: entry.id,
        title: entry.title,
        kind: nextSharePlan.kind,
        fullUrlLength: nextSharePlan.fullUrlLength,
        fallbackUrlLength: nextSharePlan.fallbackUrlLength,
        removedImageCount: nextSharePlan.removedImageCount,
      });
    } catch (error) {
      logError('workspace.article.share_failed', error, {
        entryId: entry.id,
        title: entry.title,
      });
      setCopied(false);
      setErrorMessage(formatShareError(error));
    }
  }

  async function handleFallbackShare() {
    if (!sharePlan || sharePlan.kind !== 'fallback') {
      return;
    }

    try {
      await copyShareUrl(sharePlan.fallbackUrl, 'without_images');
      setSharePlan(null);
    } catch (error) {
      logError('workspace.article.share_failed', error, {
        entryId: entry.id,
        title: entry.title,
        variant: 'without_images',
      });
      setCopied(false);
      setErrorMessage(formatShareError(error));
    }
  }

  function closeSharePlan() {
    setSharePlan(null);
  }

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <Button variant={copied ? 'solid' : 'ghost'} onClick={() => void handleShare()}>
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          {copied ? 'Copied' : 'Share'}
        </Button>
        {errorMessage ? <p className="max-w-[22rem] text-xs leading-5 text-rose-200">{errorMessage}</p> : null}
      </div>

      <Modal
        open={sharePlan !== null}
        onClose={closeSharePlan}
        title={sharePlan?.kind === 'fallback' ? 'Share link would be too long' : 'Share link unavailable'}
        description={
          sharePlan?.kind === 'fallback'
            ? 'Embedded media pushes this article past the safest browser URL limit. You can still copy a lighter share link.'
            : 'This article is too large for a reliable browser share URL.'
        }
        size="compact"
      >
        <div className="space-y-5 px-4 py-5 sm:px-6">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-soft-linen">
                {sharePlan?.kind === 'fallback' ? <ImageOff size={18} /> : <Link2Off size={18} />}
              </div>
              <div className="space-y-2 text-sm leading-6 text-muted">
                {sharePlan?.kind === 'fallback' ? (
                  <>
                    <p>
                      The full article would produce a {sharePlan.fullUrlLength}-character URL. Copy a lighter version that removes
                      {' '}
                      {sharePlan.removedImageCount} embedded image {sharePlan.removedImageCount === 1 ? 'block' : 'blocks'} instead.
                    </p>
                    <p className="text-soft-linen">The lighter link is {sharePlan.fallbackUrlLength} characters long and leaves your saved article unchanged.</p>
                  </>
                ) : sharePlan ? (
                  <p>{describeUnavailableShare(sharePlan)}</p>
                ) : null}
              </div>
            </div>
          </div>

          {errorMessage ? <p className="text-sm leading-6 text-rose-200">{errorMessage}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/8 pt-4">
            <Button variant="ghost" onClick={closeSharePlan}>
              Close
            </Button>
            {sharePlan?.kind === 'fallback' ? (
              <Button variant="solid" onClick={() => void handleFallbackShare()}>
                <Share2 size={16} />
                Copy lighter link
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  );
}
