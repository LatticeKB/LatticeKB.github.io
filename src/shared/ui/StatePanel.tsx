import type { PropsWithChildren } from 'react';
import { cn } from '../lib/classes';

type Props = PropsWithChildren<{
  title?: string;
  detail?: string;
  variant?: 'empty' | 'error';
  centered?: boolean;
}>;

export function StatePanel({ children, title, detail, variant = 'empty', centered = false }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border px-4 py-3 text-sm',
        variant === 'error'
          ? 'border-rose-400/18 bg-rose-400/8 text-rose-100'
          : 'border-dashed border-white/10 bg-white/[0.02] text-muted',
        centered && 'px-6 py-10 text-center',
      )}
    >
      {title ? <p className={cn('font-medium', variant === 'empty' && 'text-soft-linen')}>{title}</p> : null}
      {detail ? (
        <p className={cn('mt-1', variant === 'error' ? 'text-rose-100/75' : 'text-muted')}>{detail}</p>
      ) : null}
      {children}
    </div>
  );
}
