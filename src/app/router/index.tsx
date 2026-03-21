import { AppShell } from '../AppShell';
import { WorkspacePage } from '../../pages/workspace/WorkspacePage';

export function AppRouter() {
  return (
    <AppShell>
      <WorkspacePage />
    </AppShell>
  );
}
