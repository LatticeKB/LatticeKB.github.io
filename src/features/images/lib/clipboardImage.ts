export function getClipboardImage(event: ClipboardEvent) {
  const items = Array.from(event.clipboardData?.items ?? []);
  const fileItem = items.find((item) => item.type.startsWith('image/'));
  return fileItem?.getAsFile() ?? null;
}
