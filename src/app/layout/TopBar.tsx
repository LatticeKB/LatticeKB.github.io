import { DatabaseZap, Download, FileUp, FilePlus2 } from 'lucide-react';
import { Button } from '../../shared/ui/Button';

type Props = {
  corpusName: string;
  onLoadCorpus: () => void;
  onNewArticle: () => void;
  onDownloadJson: () => void;
};

export function TopBar({ corpusName, onLoadCorpus, onNewArticle, onDownloadJson }: Props) {
  return (
    <header className="border-b border-white/7 bg-black/8 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-teal/35 bg-teal/12 text-teal">
              <DatabaseZap size={16} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold tracking-[0.18em] text-soft-linen uppercase">LatticeKB</p>
                <p className="hidden text-xs text-muted sm:block">private / single json / dark</p>
              </div>
              <p className="truncate text-xs text-muted">{corpusName}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button onClick={onLoadCorpus}>
            <FileUp size={16} />
            Load corpus
          </Button>
          <Button onClick={onNewArticle}>
            <FilePlus2 size={16} />
            New article
          </Button>
          <Button variant="solid" onClick={onDownloadJson}>
            <Download size={16} />
            Download JSON
          </Button>
        </div>
      </div>
    </header>
  );
}
