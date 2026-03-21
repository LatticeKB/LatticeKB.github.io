import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../lib/classes';

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  active?: boolean;
};

export function Chip({ active = false, children, className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition duration-150 ease-quiet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
        active
          ? 'border-teal/55 bg-teal/14 text-soft-linen'
          : 'border-white/8 bg-white/4 text-muted hover:border-white/14 hover:text-soft-linen',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
