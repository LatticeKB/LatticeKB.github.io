import type { BlockNoteEditor } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import type { CorpusEntry } from '../../../features/corpus/model/types';
import { cn } from '../../../shared/lib/classes';

type Props = {
  entry: CorpusEntry;
  editor: BlockNoteEditor;
  appearance?: 'dark' | 'print';
  className?: string;
};

export function ArticleBody({ entry, editor, appearance = 'dark', className }: Props) {
  if (entry.body.blocks.length === 0) {
    return <p className="text-base leading-7 text-muted">No document body yet.</p>;
  }

  return (
    <div
      className={cn(
        'article-body p-4 sm:p-5',
        appearance === 'dark'
          ? 'rounded-[26px] border border-white/8 bg-panel/90'
          : 'article-body--print rounded-[28px] border border-slate-200 bg-white text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <BlockNoteView
        editor={editor}
        editable={false}
        theme={appearance === 'print' ? 'light' : 'dark'}
        sideMenu={false}
        formattingToolbar={false}
        slashMenu={false}
        className="bg-transparent"
      />
    </div>
  );
}