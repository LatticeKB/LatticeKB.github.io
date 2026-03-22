import type { SearchHit } from '../../../features/search/model/searchTypes';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ResultRow } from './ResultRow';

type Props = {
  results: SearchHit[];
  selectedEntryId: string | null;
  onOpenArticle: (id: string) => void;
  onHoverArticle: (id: string | null) => void;
  onTogglePinned: (id: string) => void;
};

export function ResultList({ results, selectedEntryId, onOpenArticle, onHoverArticle, onTogglePinned }: Props) {
  if (results.length === 0) {
    return <EmptyState>No results match the current query and filters.</EmptyState>;
  }

  return (
    <div className="space-y-3" onMouseLeave={() => onHoverArticle(null)}>
      {results.map((hit) => (
        <ResultRow
          key={hit.entry.id}
          hit={hit}
          active={hit.entry.id === selectedEntryId}
          onOpen={() => onOpenArticle(hit.entry.id)}
          onHover={() => onHoverArticle(hit.entry.id)}
          onTogglePinned={() => onTogglePinned(hit.entry.id)}
        />
      ))}
    </div>
  );
}
