type MaybeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MaybeRecord {
  return typeof value === 'object' && value !== null;
}

function walkBlocks(blocks: unknown[], callback: (block: MaybeRecord) => void) {
  for (const candidate of blocks) {
    if (!isRecord(candidate)) {
      continue;
    }

    callback(candidate);
    const children = candidate.children;
    if (Array.isArray(children)) {
      walkBlocks(children, callback);
    }
  }
}

export function extractImageMetadata(blocks: unknown[]) {
  const images: Array<{ caption: string; alt: string; url: string }> = [];
  walkBlocks(blocks, (block) => {
    if (block.type !== 'image') {
      return;
    }

    const props = isRecord(block.props) ? block.props : {};
    const url = typeof props.url === 'string' ? props.url : '';
    const caption = typeof props.caption === 'string' ? props.caption : '';
    const alt = typeof props.alt === 'string' ? props.alt : '';
    if (url) {
      images.push({ caption, alt, url });
    }
  });

  return images;
}

export function hasImageBlocks(blocks: unknown[]) {
  return extractImageMetadata(blocks).length > 0;
}
