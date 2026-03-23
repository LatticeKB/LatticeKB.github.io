import { AlertTriangle, Download } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { describeCorpusSyncWarning } from '../model/corpusSync';
import type { CorpusSyncState } from '../model/corpusSync';

type Props = {
  syncState: CorpusSyncState;
  onDownload: () => void;
};

export function CorpusSyncBanner({ syncState, onDownload }: Props) {
  const copy = describeCorpusSyncWarning(syncState);

  return (
    <section className="rounded-[28px] border border-amber-300/20 bg-amber-300/8 p-4 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-100">
            <AlertTriangle size={16} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100/70">Sync warning</p>
            <p className="mt-1 font-medium text-soft-linen">{copy.title}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-50/80">{copy.detail}</p>
          </div>
        </div>
        <Button
          variant="subtle"
          onClick={onDownload}
          className="border-amber-300/25 bg-amber-300/10 text-amber-50 hover:bg-amber-300/16 focus-visible:outline-amber-200"
        >
          <Download size={16} />
          {copy.actionLabel}
        </Button>
      </div>
    </section>
  );
}
