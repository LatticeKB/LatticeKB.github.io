import { Chip } from '../../../shared/ui/Chip';

const quickQueries = ['vpn token', 'outlook mailbox', 'screen recording', 'printer queue', 'conditional access'];

type Props = {
  onSelect: (query: string) => void;
};

export function QueryChips({ onSelect }: Props) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {quickQueries.map((item) => (
        <Chip key={item} onClick={() => onSelect(item)}>
          {item}
        </Chip>
      ))}
    </div>
  );
}
