type Props = {
  imageCount: number;
};

export function ImageBlockTools({ imageCount }: Props) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4">
      <h3 className="text-xs uppercase tracking-[0.18em] text-muted">Images</h3>
      <p className="mt-3 text-sm leading-6 text-muted">
        Screenshot paste is first-class. Press <span className="font-mono text-soft-linen">⌘V</span> after copying an image or drag files into the editor. Images are embedded as base64 data URLs inside the exported corpus.
      </p>
      <p className="mt-3 text-xs text-soft-linen">{imageCount} inline image {imageCount === 1 ? 'block' : 'blocks'} in this article.</p>
    </section>
  );
}
