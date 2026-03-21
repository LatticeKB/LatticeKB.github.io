import type { CorpusEntry } from '../model/types';
import { contentToPlainText } from '../../editor/lib/blockTransforms';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderBlocks(entry: CorpusEntry) {
  return entry.body.blocks
    .map((rawBlock) => {
      const block = rawBlock as Record<string, unknown>;
      const type = typeof block.type === 'string' ? block.type : 'paragraph';
      const text = escapeHtml(contentToPlainText(block.content).trim());
      const props = (typeof block.props === 'object' && block.props !== null ? block.props : {}) as Record<string, unknown>;

      if (type === 'image' && typeof props.url === 'string' && props.url) {
        const alt = typeof props.alt === 'string' ? props.alt : entry.title;
        const caption = typeof props.caption === 'string' ? props.caption : '';
        return `<figure><img src="${props.url}" alt="${escapeHtml(alt)}" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
      }

      if (type === 'heading') {
        const level = Number(props.level ?? 2);
        const tag = level <= 2 ? 'h2' : 'h3';
        return `<${tag}>${text || 'Untitled section'}</${tag}>`;
      }

      if (type === 'bulletListItem') {
        return `<p class="list-item">• ${text}</p>`;
      }

      if (type === 'numberedListItem') {
        return `<p class="list-item"># ${text}</p>`;
      }

      return text ? `<p>${text}</p>` : '';
    })
    .join('');
}

export function openArticleInNewTab(entry: CorpusEntry) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(entry.title)} · LatticeKB</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: "IBM Plex Sans", system-ui, sans-serif; background: #221d23; color: #ecebe4; }
    main { max-width: 920px; margin: 0 auto; padding: 48px 20px 72px; }
    .meta { color: #a8a19f; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; }
    h1 { font-size: clamp(2rem, 6vw, 3.6rem); line-height: 1.05; margin: 16px 0 12px; }
    h2, h3 { margin: 32px 0 12px; }
    p { color: rgba(236,235,228,0.88); line-height: 1.8; margin: 0 0 14px; }
    .summary { color: #a8a19f; margin-bottom: 28px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 28px; }
    .chips span { border: 1px solid rgba(236,235,228,0.12); border-radius: 999px; padding: 6px 10px; font-size: 12px; color: #ecebe4; }
    figure { margin: 22px 0; border: 1px solid rgba(236,235,228,0.1); border-radius: 22px; overflow: hidden; background: rgba(0,0,0,0.16); }
    img { display: block; width: 100%; max-height: 70vh; object-fit: contain; background: rgba(0,0,0,0.28); }
    figcaption { padding: 12px 16px; color: #a8a19f; font-size: 14px; border-top: 1px solid rgba(236,235,228,0.08); }
    .list-item { padding-left: 2px; }
  </style>
</head>
<body>
  <main>
    <div class="meta">${escapeHtml(entry.product)} / ${escapeHtml(entry.category)}</div>
    <h1>${escapeHtml(entry.title)}</h1>
    <p class="summary">${escapeHtml(entry.summary)}</p>
    <div class="chips">${entry.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
    ${renderBlocks(entry)}
  </main>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const handle = window.open(url, '_blank', 'noopener,noreferrer');
  if (handle) {
    handle.addEventListener('beforeunload', () => URL.revokeObjectURL(url), { once: true });
  } else {
    URL.revokeObjectURL(url);
  }
}
