import type { PropsWithChildren } from 'react';
import { MantineProvider } from '@mantine/core';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MantineProvider defaultColorScheme="dark">
      {children}
    </MantineProvider>
  );
}
