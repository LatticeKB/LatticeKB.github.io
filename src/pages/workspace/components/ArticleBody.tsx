import type { CorpusEntry, StoredBlock } from '../../../features/corpus/model/types';
import { contentToPlainText } from '../../../features/editor/lib/blockTransforms';

type Props = {
  entry: CorpusEntry;
};

type RenderNode = StoredBlock & {
  id?: string;
  type?: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: unknown;
};

function asBlocks(input: unknown): RenderNode[] {
  return Array.isArray(input) ? (input as RenderNode[]) : [];
}

function renderBlock(block: RenderNode, entry: CorpusEntry) {
  const text = contentToPlainText(block.content).trim();
  const key = block.id ?? `${block.type ?? 'block'}-${text || 'empty'}`;
  const children = asBlocks(block.children);
  const nested = children.length > 0 ? <div className="mt-3 space-y-3">{children.map((child) => renderBlock(child, entry))}</div> : null;

  switch (block.type) {
    case 'heading': {
      const level = Number(block.props?.level ?? 2);
      const className = level <= 2 ? 'text-2xl font-semibold tracking-[-0.03em]' : 'text-xl font-semibold';
      return (
        <section key={key} className="space-y-3">
          <h3 className={className}>{text || 'Untitled section'}</h3>
          {nested}
        </section>
      );
    }
    case 'bulletListItem':
      return (
        <div key={key} className="flex gap-3 text-base leading-7 text-soft-linen/88">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal" />
          <div className="min-w-0 flex-1">
            <p>{text}</p>
            {nested}
          </div>
        </div>
      );
    case 'numberedListItem':
      return (
        <div key={key} className="flex gap-3 text-base leading-7 text-soft-linen/88">
          <span className="font-mono text-sm text-teal">#</span>
          <div className="min-w-0 flex-1">
            <p>{text}</p>
            {nested}
          </div>
        </div>
      );
    case 'image': {
      const url = typeof block.props?.url === 'string' ? block.props.url : '';
      const caption = typeof block.props?.caption === 'string' ? block.props.caption : '';
      const alt = typeof block.props?.alt === 'string' ? block.props.alt : entry.title;
      if (!url) {
        return null;
      }

      return (
        <figure key={key} className="overflow-hidden rounded-[26px] border border-white/8 bg-black/18">
          <img src={url} alt={alt} className="block max-h-[60vh] w-full object-contain bg-black/30" />
          {caption ? <figcaption className="border-t border-white/8 px-4 py-3 text-sm text-muted">{caption}</figcaption> : null}
        </figure>
      );
    }
    default:
      return (
        <section key={key} className="space-y-3">
          {text ? <p className="text-base leading-7 text-soft-linen/88">{text}</p> : null}
          {nested}
        </section>
      );
  }
}

export function ArticleBody({ entry }: Props) {
  return <div className="space-y-5">{entry.body.blocks.map((block) => renderBlock(block as RenderNode, entry))}</div>;
}
