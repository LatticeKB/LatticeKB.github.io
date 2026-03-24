import type { BlockNoteEditor } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import type { CorpusEntry } from '../../../features/corpus/model/types';

type Props = {
  entry: CorpusEntry;
};

export function ArticleBody({ entry }: Props) {
  if (entry.body.blocks.length === 0) {
    return <p className="text-base leading-7 text-muted">No document body yet.</p>;
  }

  return <ReadonlyArticleDocument key={`${entry.id}-${entry.updatedAt}`} blocks={entry.body.blocks} />;
}

type ReadonlyArticleDocumentProps = {
  blocks: Record<string, unknown>[];
};

function ReadonlyArticleDocument({ blocks }: ReadonlyArticleDocumentProps) {
  const editor = useCreateBlockNote(
    {
      initialContent: blocks,
      defaultStyles: false,
    },
    [blocks],
  );

  return (
    <div className="rounded-[26px] border border-white/8 bg-panel/90 p-4 sm:p-5">
      <BlockNoteView
        editor={editor as BlockNoteEditor}
        editable={false}
        theme="dark"
        sideMenu={false}
        formattingToolbar={false}
        slashMenu={false}
        className="bg-transparent"
      />
    </div>
  );
}
