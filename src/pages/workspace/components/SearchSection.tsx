import type { SearchFilters } from '../../../features/search/model/searchTypes';
import { QueryChips } from './QueryChips';
import { SearchBar } from './SearchBar';

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onQuickQuery: (value: string) => void;
  rankingOpen: boolean;
  onToggleRanking: () => void;
  filters: SearchFilters;
};

export function SearchSection({
  query,
  onQueryChange,
  onQuickQuery,
  rankingOpen,
  onToggleRanking,
  filters,
}: Props) {
  return (
    <section className="mx-auto max-w-5xl px-5 pt-8 pb-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">Local-first retrieval workspace</p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,3.35rem)] font-semibold tracking-[-0.03em] text-soft-linen">
          Search first. Edit when needed.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
          Load a single corpus, search with local BM25 ranking, preview the note, then step into the editor only when you need to write.
        </p>
      </div>
      <div className="mt-8">
        <SearchBar query={query} onQueryChange={onQueryChange} rankingOpen={rankingOpen} onToggleRanking={onToggleRanking} />
        <QueryChips onSelect={onQuickQuery} />
        {rankingOpen ? (
          <div className="mx-auto mt-4 max-w-3xl rounded-3xl border border-white/8 bg-black/12 px-4 py-3 text-left text-sm text-muted">
            Ranked locally with MiniSearch BM25-style scoring. Title, tags, aliases, and summaries are boosted above body text. Active filters: pinned {filters.pinnedOnly ? 'on' : 'off'}, recent {filters.recentOnly ? 'on' : 'off'}, has images {filters.hasImages ? 'on' : 'off'}.
          </div>
        ) : null}
      </div>
    </section>
  );
}
