import { useEffect, useMemo, useState } from 'react';
import { Eraser, Save } from 'lucide-react';
import { Modal } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';
import { formatAbsoluteDate } from '../../shared/lib/dates';
import { readScratchpad, saveScratchpad, clearScratchpad } from '../../features/persistence/lib/scratchpadStore';
import { BlockEditorWrapper } from '../editor/components/BlockEditorWrapper';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ScratchpadModal({ open, onClose }: Props) {
  const [blocks, setBlocks] = useState<Record<string, unknown>[]>(() => readScratchpad().blocks);
  const [updatedAt, setUpdatedAt] = useState(() => readScratchpad().updatedAt);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handle = window.setTimeout(() => {
      try {
        const nextUpdatedAt = saveScratchpad(blocks);
        setUpdatedAt(nextUpdatedAt);
        setSaveError(null);
      } catch {
        setSaveError('Unable to autosave scratchpad to this browser.');
      }
    }, 450);

    return () => window.clearTimeout(handle);
  }, [blocks, open]);

  useEffect(() => {
    if (!confirmClear) {
      return;
    }

    const handle = window.setTimeout(() => setConfirmClear(false), 3500);
    return () => window.clearTimeout(handle);
  }, [confirmClear]);

  const statusText = useMemo(() => {
    if (saveError) {
      return saveError;
    }

    if (!updatedAt) {
      return 'Autosaves to this browser every few moments.';
    }

    return `Autosaved ${formatAbsoluteDate(updatedAt)}.`;
  }, [saveError, updatedAt]);

  function handleSaveNow() {
    try {
      const nextUpdatedAt = saveScratchpad(blocks);
      setUpdatedAt(nextUpdatedAt);
      setSaveError(null);
    } catch {
      setSaveError('Unable to save scratchpad to this browser.');
    }
  }

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }

    clearScratchpad();
    setBlocks([]);
    setUpdatedAt('');
    setSaveError(null);
    setConfirmClear(false);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Scratchpad"
      description="Browser-local call notes. Not included in corpus export. Screenshot paste works here too."
      className="h-[min(94vh,980px)]"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-6">
          <p className="text-sm text-muted">{statusText}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" onClick={handleSaveNow}>
              <Save size={16} />
              Save now
            </Button>
            <Button variant={confirmClear ? 'danger' : 'ghost'} onClick={handleClear}>
              <Eraser size={16} />
              {confirmClear ? 'Confirm clear' : 'Clear'}
            </Button>
          </div>
        </div>
        <div className="lattice-scrollbar min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <BlockEditorWrapper initialBlocks={blocks} onBlocksChange={setBlocks} />
            <p className="mt-4 text-xs text-muted">Local scratchpad only. Use the article editor when notes should become part of the corpus.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
