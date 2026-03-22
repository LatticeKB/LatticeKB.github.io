import type { ReactNode } from 'react';
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

function renderInlineContent(input: unknown): ReactNode {
  if (typeof input === 'string') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item, index) => <span key={index}>{renderInlineContent(item)}</span>);
  }

  if (typeof input === 'object' && input !== null) {
    const node = input as Record<string, unknown>;
    const text = typeof node.text === 'string' ? node.text : '';
    const href = typeof node.href === 'string' ? node.href : undefined;
    const nested = 'content' in node ? renderInlineContent(node.content) : text;

    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-teal underline decoration-teal/45 underline-offset-4 hover:text-soft-linen"
        >
          {nested}
        </a>
      );
    }

    if (typeof node.type === 'string' && node.type === 'link') {
      const linkHref = typeof node.props === 'object' && node.props !== null && typeof (node.props as Record<string, unknown>).url === 'string'
        ? ((node.props as Record<string, unknown>).url as string)
        : undefined;
      if (linkHref) {
        return (
          <a
            href={linkHref}
            target="_blank"
            rel="noreferrer noopener"
            className="text-teal underline decoration-teal/45 underline-offset-4 hover:text-soft-linen"
          >
            {nested}
          </a>
        );
      }
    }

    return nested;
  }

  return null;
}

function renderBlock(block: RenderNode, entry: CorpusEntry) {
  const text = contentToPlainText(block.content).trim();
  const key = block.id ?? `${block.type ?? 'block'}-${text || 'empty'}`;
  const children = asBlocks(block.children);
  const nested: ReactNode = children.length > 0 ? <div className="mt-3 space-y-3">{children.map((child) => renderBlock(child, entry))}</div> : null;
  const richContent = renderInlineContent(block.content);

  switch (block.type) {
    case 'heading': {
      const level = Number(block.props?.level ?? 2);
      const className = level <= 2 ? 'text-2xl font-semibold tracking-[-0.03em]' : 'text-xl font-semibold';
      return (
        <section key={key} className="space-y-3">
          <h3 className={className}>{richContent || text || 'Untitled section'}</h3>
          {nested}
        </section>
      );
    }
    case 'bulletListItem':
      return (
        <div key={key} className="flex gap-3 text-base leading-7 text-soft-linen/88">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal" />
          <div className="min-w-0 flex-1">
            <p>{richContent || text}</p>
            {nested}
          </div>
        </div>
      );
    case 'numberedListItem':
      return (
        <div key={key} className="flex gap-3 text-base leading-7 text-soft-linen/88">
          <span className="font-mono text-sm text-teal">#</span>
          <div className="min-w-0 flex-1">
            <p>{richContent || text}</p>
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
    case 'file': {
      const url = typeof block.props?.url === 'string' ? block.props.url : '';
      const name = typeof block.props?.name === 'string' ? block.props.name : 'Attached file';
      if (!url) {
        return null;
      }

      return (
        <div key={key} className="rounded-2xl border border-white/8 bg-black/18 p-4">
          <a href={url} target="_blank" rel="noreferrer noopener" className="text-teal underline underline-offset-4">
            {name}
          </a>
        </div>
      );
    }
    default:
      return (
        <section key={key} className="space-y-3">
          {text || richContent ? <p className="text-base leading-7 text-soft-linen/88">{richContent || text}</p> : null}
          {nested}
        </section>
      );
  }
}

export function ArticleBody({ entry }: Props) {
  return <div className="space-y-5">{entry.body.blocks.map((block) => renderBlock(block as RenderNode, entry))}</div>;
}
