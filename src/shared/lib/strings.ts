export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}…`;
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
