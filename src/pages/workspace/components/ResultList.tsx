import type { SearchHit } from '../../../features/search/model/searchTypes';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ResultRow } from './ResultRow';

type Props = {
  results: SearchHit[];
  selectedEntryId: string | null;
  onOpenArticle: (id: string) => void;
};

export function ResultList({ results, selectedEntryId, onOpenArticle }: Props) {
  if (results.length === 0) {
    return <EmptyState>No results match the current query and filters.</EmptyState>;
  }

  return (
    <div className="space-y-3">
      {results.map((hit) => (
        <ResultRow
          key={hit.entry.id}
          hit={hit}
          active={hit.entry.id === selectedEntryId}
          onSelect={() => onOpenArticle(hit.entry.id)}
        />
      ))}
    </div>
  );
}
