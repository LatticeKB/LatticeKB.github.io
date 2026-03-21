import type { PropsWithChildren } from 'react';

export function EmptyState({ children }: PropsWithChildren) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted">
      {children}
    </div>
  );
}
