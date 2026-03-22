import type { PropsWithChildren } from 'react';

export function AppShell({ children }: PropsWithChildren) {
  return <div className="min-h-screen overflow-x-clip bg-shadow-grey text-soft-linen">{children}</div>;
}
