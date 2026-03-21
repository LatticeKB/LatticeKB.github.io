import { Chip } from '../../../shared/ui/Chip';

type Props = {
  suggestions: string[];
  onAccept: (tag: string) => void;
};

export function SuggestedTags({ suggestions, onAccept }: Props) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.18em] text-muted">Suggestions</h3>
        <span className="text-xs text-muted">rule-based</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.length > 0 ? (
          suggestions.map((tag) => (
            <Chip key={tag} onClick={() => onAccept(tag)}>
              + {tag}
            </Chip>
          ))
        ) : (
          <p className="text-sm text-muted">Nothing obvious yet. Suggestions update from the title, summary, and document text.</p>
        )}
      </div>
    </section>
  );
}
