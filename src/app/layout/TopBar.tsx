import { DatabaseZap, Download, FilePenLine, FilePlus2, FileUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Modal } from '../../shared/ui/Modal';

type Props = {
  corpusName: string;
  onRenameCorpus: (nextName: string) => void;
  onLoadCorpus: () => void;
  onOpenScratchpad: () => void;
  onNewArticle: () => void;
  onDownloadJson: () => void;
};

export function TopBar({ corpusName, onRenameCorpus, onLoadCorpus, onOpenScratchpad, onNewArticle, onDownloadJson }: Props) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [draftName, setDraftName] = useState(corpusName);

  useEffect(() => {
    if (!renameOpen) {
      setDraftName(corpusName);
    }
  }, [corpusName, renameOpen]);

  const trimmedDraftName = draftName.trim();
  const renameDisabled = trimmedDraftName.length === 0 || trimmedDraftName === corpusName;

  function openRenameModal() {
    setDraftName(corpusName);
    setRenameOpen(true);
  }

  function closeRenameModal() {
    setRenameOpen(false);
  }

  function submitRename() {
    if (renameDisabled) {
      return;
    }

    onRenameCorpus(trimmedDraftName);
    closeRenameModal();
  }

  return (
    <>
      <header className="border-b border-white/7 bg-black/8 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-teal/35 bg-teal/12 text-teal">
                <DatabaseZap size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-[0.18em] text-soft-linen uppercase">LatticeKB</p>
                <button
                  type="button"
                  onClick={openRenameModal}
                  className="mt-1 max-w-full truncate text-left text-xs text-muted underline decoration-white/15 underline-offset-4 transition hover:text-soft-linen hover:decoration-teal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal/60"
                  aria-label={`Rename corpus ${corpusName}`}
                  title="Rename current corpus"
                >
                  {corpusName}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button onClick={onLoadCorpus}>
              <FileUp size={16} />
              Load corpus
            </Button>
            <Button onClick={onOpenScratchpad}>
              <FilePenLine size={16} />
              Scratchpad
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

      <Modal
        open={renameOpen}
        onClose={closeRenameModal}
        title="Rename corpus"
        description="Update the workspace name used in the header and for the next JSON download."
        size="compact"
      >
        <form
          className="space-y-5 px-4 py-5 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault();
            submitRename();
          }}
        >
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted">Corpus name</span>
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="team-knowledge-base.json"
              aria-label="Corpus name"
              autoFocus
            />
          </label>
          <p className="text-sm leading-6 text-muted">
            Rename only changes this workspace label. The underlying corpus content stays the same until you download a fresh JSON file.
          </p>
          <div className="flex flex-wrap justify-end gap-2 border-t border-white/8 pt-4">
            <Button variant="ghost" onClick={closeRenameModal}>
              Cancel
            </Button>
            <Button variant="solid" type="submit" disabled={renameDisabled}>
              Save name
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
