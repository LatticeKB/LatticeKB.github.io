import type { PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  sidebar: ReactNode;
}>;

export function WorkspaceLayout({ children, sidebar }: Props) {
  return (
    <div className="mx-auto grid w-full max-w-[1480px] gap-6 px-5 pb-8 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_380px] lg:px-8">
      <div className="min-w-0">{children}</div>
      <aside className="min-w-0">{sidebar}</aside>
    </div>
  );
}
