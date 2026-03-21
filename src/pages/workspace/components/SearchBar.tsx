import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  rankingOpen: boolean;
  onToggleRanking: () => void;
};

export function SearchBar({ query, onQueryChange, rankingOpen, onToggleRanking }: Props) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="group flex items-center gap-3 rounded-[30px] border border-white/10 bg-black/18 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-150 ease-quiet focus-within:border-teal/55">
        <Search className="text-muted" size={18} />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search notes, tags, aliases, body, captions"
          aria-label="Search knowledge base"
          className="border-none bg-transparent px-0 py-0 text-base shadow-none focus:bg-transparent"
        />
        <Button variant={rankingOpen ? 'solid' : 'ghost'} className="rounded-full px-3 py-1.5" onClick={onToggleRanking}>
          <SlidersHorizontal size={15} />
          BM25
        </Button>
      </div>
    </div>
  );
}
