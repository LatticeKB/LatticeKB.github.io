import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import type { BlockNoteEditor } from '@blocknote/core';
import { useState } from 'react';
import { embedFileAsDataUrl } from '../../../features/images/lib/embedFileAsDataUrl';
import { getClipboardImage } from '../../../features/images/lib/clipboardImage';

type Props = {
  initialBlocks: Record<string, unknown>[];
  onBlocksChange: (blocks: Record<string, unknown>[]) => void;
};

const defaultBlock = [
  {
    id: 'starter',
    type: 'paragraph',
    content: '',
  },
] satisfies Record<string, unknown>[];

export function BlockEditorWrapper({ initialBlocks, onBlocksChange }: Props) {
  const [initialContent] = useState<Record<string, unknown>[]>(() =>
    initialBlocks.length > 0 ? initialBlocks : defaultBlock,
  );

  const editor = useCreateBlockNote(
    {
      initialContent,
      defaultStyles: false,
      uploadFile: async (file) => embedFileAsDataUrl(file),
      pasteHandler: ({ event, defaultPasteHandler }) => {
        const image = getClipboardImage(event);
        if (!image) {
          return defaultPasteHandler();
        }

        return defaultPasteHandler();
      },
    },
    [],
  );

  return (
    <div className="rounded-[26px] border border-white/8 bg-panel/90 p-4 sm:p-5">
      <BlockNoteView
        editor={editor as BlockNoteEditor}
        theme="dark"
        sideMenu
        formattingToolbar
        slashMenu
        className="min-h-[44vh] bg-transparent sm:min-h-[56vh]"
        onChange={(currentEditor) => onBlocksChange(currentEditor.document as unknown as Record<string, unknown>[])}
      />
    </div>
  );
}
