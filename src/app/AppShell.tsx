import type { PropsWithChildren } from 'react';

export function AppShell({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-shadow-grey text-soft-linen">{children}</div>;
}
