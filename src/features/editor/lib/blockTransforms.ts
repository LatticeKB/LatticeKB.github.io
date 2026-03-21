type MaybeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MaybeRecord {
  return typeof value === 'object' && value !== null;
}

function flattenText(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(flattenText).join(' ');
  }

  if (isRecord(input)) {
    const parts: string[] = [];

    if (typeof input.text === 'string') {
      parts.push(input.text);
    }

    if ('content' in input) {
      parts.push(flattenText(input.content));
    }

    if (isRecord(input.props)) {
      if (typeof input.props.caption === 'string') {
        parts.push(input.props.caption);
      }

      if (typeof input.props.alt === 'string') {
        parts.push(input.props.alt);
      }

      if (typeof input.props.title === 'string') {
        parts.push(input.props.title);
      }
    }

    if (Array.isArray(input.children)) {
      parts.push(input.children.map(flattenText).join(' '));
    }

    return parts.join(' ');
  }

  return '';
}

export function blocksToPlainText(blocks: unknown[]) {
  return flattenText(blocks).replace(/\s+/g, ' ').trim();
}
