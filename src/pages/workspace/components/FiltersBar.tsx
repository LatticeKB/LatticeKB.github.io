import type { SearchFilters } from '../../../features/search/model/searchTypes';
import { Chip } from '../../../shared/ui/Chip';

type Props = {
  filters: SearchFilters;
  onChange: (next: Partial<SearchFilters>) => void;
};

export function FiltersBar({ filters, onChange }: Props) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
      <Chip active={filters.pinnedOnly} onClick={() => onChange({ pinnedOnly: !filters.pinnedOnly })}>
        pinned
      </Chip>
      <Chip active={filters.recentOnly} onClick={() => onChange({ recentOnly: !filters.recentOnly })}>
        recent 30d
      </Chip>
      <Chip active={filters.hasImages} onClick={() => onChange({ hasImages: !filters.hasImages })}>
        has images
      </Chip>
    </div>
  );
}
