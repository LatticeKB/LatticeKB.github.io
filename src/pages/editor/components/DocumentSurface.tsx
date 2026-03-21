import { lazy, Suspense } from 'react';
import { Input } from '../../../shared/ui/Input';
import { SlashMenuHint } from './SlashMenuHint';

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  blocks: Record<string, unknown>[];
  onBlocksChange: (blocks: Record<string, unknown>[]) => void;
};

const BlockEditorWrapper = lazy(async () =>
  import('./BlockEditorWrapper').then((module) => ({ default: module.BlockEditorWrapper })),
);

export function DocumentSurface({ title, onTitleChange, blocks, onBlocksChange }: Props) {
  return (
    <div className="min-h-[48vh] flex-1 overflow-visible px-4 py-4 sm:px-6 sm:py-5 lg:min-h-0 lg:overflow-auto lg:px-6 lg:py-6 lattice-scrollbar">
      <div className="mx-auto max-w-4xl">
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Untitled article"
          aria-label="Article title"
          className="mb-5 border-none bg-transparent px-0 text-3xl font-semibold tracking-[-0.04em] text-soft-linen placeholder:text-soft-linen/35 focus:bg-transparent sm:text-4xl"
        />
        <Suspense
          fallback={
            <div className="rounded-[26px] border border-white/8 bg-panel/90 p-5 text-sm text-muted">
              Loading editor surface…
            </div>
          }
        >
          <BlockEditorWrapper initialBlocks={blocks} onBlocksChange={onBlocksChange} />
        </Suspense>
        <SlashMenuHint />
      </div>
    </div>
  );
}
