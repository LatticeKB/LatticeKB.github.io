import { Check, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildShareArticleUrl } from '../../../features/corpus/lib/openArticleInNewTab';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { logAction, logError } from '../../../shared/lib/clientLogger';
import { Button } from '../../../shared/ui/Button';

type Props = {
  entry: CorpusEntry;
};

const COPIED_RESET_MS = 2000;

export function ShareArticleButton({ entry }: Props) {
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleShare() {
    logAction('workspace.article.share_requested', {
      entryId: entry.id,
      title: entry.title,
    });
    try {
      await navigator.clipboard.writeText(buildShareArticleUrl(entry));
      logAction('workspace.article.share_copied', {
        entryId: entry.id,
        title: entry.title,
      });
      setErrorMessage(null);
      setCopied(true);
    } catch (error) {
      logError('workspace.article.share_failed', error, {
        entryId: entry.id,
        title: entry.title,
      });
      setCopied(false);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to copy share link.');
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant={copied ? 'solid' : 'ghost'} onClick={() => void handleShare()}>
        {copied ? <Check size={16} /> : <Share2 size={16} />}
        {copied ? 'Copied' : 'Share'}
      </Button>
      {errorMessage ? <p className="max-w-[22rem] text-xs leading-5 text-rose-200">{errorMessage}</p> : null}
    </div>
  );
}
