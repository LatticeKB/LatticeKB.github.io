import { Check, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildShareArticleUrl } from '../../../features/corpus/lib/openArticleInNewTab';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { Button } from '../../../shared/ui/Button';

type Props = {
  entry: CorpusEntry;
};

const COPIED_RESET_MS = 2000;

export function ShareArticleButton({ entry }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(buildShareArticleUrl(entry));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant={copied ? 'solid' : 'ghost'} onClick={() => void handleShare()}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? 'Copied' : 'Share'}
    </Button>
  );
}
