import { SearchBar } from './SearchBar';

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
      <div className="mt-8">
        <SearchBar query={query} onQueryChange={onQueryChange} />
      </div>
    </section>
  );
}
