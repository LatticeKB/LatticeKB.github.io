import { Search } from 'lucide-react';
import { Input } from '../../../shared/ui/Input';

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function SearchSection({ query, onQueryChange }: Props) {
  return (
    <section className="mx-auto max-w-5xl px-5 pt-8 pb-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">Local-first retrieval workspace</p>
        <h1 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] font-semibold tracking-[-0.03em] text-soft-linen">
          LatticeKB
        </h1>
      </div>
      <div className="mt-8 mx-auto max-w-4xl">
        <div className="group flex items-center gap-3 rounded-[30px] border border-white/10 bg-black/18 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-150 ease-quiet focus-within:border-teal/55">
          <Search className="text-muted" size={18} />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search notes, tags, aliases, body, captions"
            aria-label="Search knowledge base"
            className="border-none bg-transparent px-0 py-0 text-base shadow-none focus:bg-transparent"
          />
        </div>
      </div>
    </section>
  );
}
