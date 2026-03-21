import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';

type Props = {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
};

export function TagEditor({ tags, onAddTag, onRemoveTag }: Props) {
  const [draft, setDraft] = useState('');

  function submit() {
    if (!draft.trim()) {
      return;
    }

    onAddTag(draft);
    setDraft('');
  }

  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.18em] text-muted">Tags</h3>
        <span className="text-xs text-muted">manual</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/8 px-2.5 py-1 text-xs text-soft-linen">
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => onRemoveTag(tag)} className="text-muted hover:text-soft-linen">
              <X size={12} />
            </button>
          </span>
        ))}
        {tags.length === 0 ? <p className="text-sm text-muted">No tags yet.</p> : null}
      </div>
      <div className="mt-4 flex gap-2">
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add tag" onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        }} />
        <Button onClick={submit}>Add</Button>
      </div>
    </section>
  );
}
