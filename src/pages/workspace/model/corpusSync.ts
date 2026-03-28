import { exportCorpus } from '../../../features/corpus/lib/exportCorpus';
import type { CorpusFile } from '../../../features/corpus/model/types';

export type CorpusSyncOrigin = 'sample' | 'file' | 'download';

export type CorpusSyncState = {
  baselineSnapshot: string;
  baselineName: string;
  origin: CorpusSyncOrigin;
};

export type CorpusSyncCopy = {
  title: string;
  detail: string;
  actionLabel: string;
};

export function createCorpusSyncState(corpus: CorpusFile, baselineName: string, origin: CorpusSyncOrigin): CorpusSyncState {
  return {
    baselineSnapshot: exportCorpus(corpus),
    baselineName,
    origin,
  };
}

export function hasPendingCorpusChanges(syncState: CorpusSyncState, currentSnapshot: string) {
  return syncState.baselineSnapshot !== currentSnapshot;
}

export function describeCorpusSyncWarning(syncState: CorpusSyncState): CorpusSyncCopy {
  if (syncState.origin === 'file') {
    return {
      title: 'Uploaded JSON is out of sync',
      detail: `The in-browser workspace no longer matches ${syncState.baselineName}. Download JSON again to keep the latest corpus changes.`,
      actionLabel: 'Download updated JSON',
    };
  }

  if (syncState.origin === 'download') {
    return {
      title: 'Downloaded JSON is out of sync',
      detail: `You changed the workspace after downloading ${syncState.baselineName}. Download JSON again before leaving if you want the file to include those edits.`,
      actionLabel: 'Download latest JSON',
    };
  }

  return {
    title: 'Workspace has local changes',
    detail: 'This browser copy has changed since the initial sample corpus. Download JSON if you want to keep the current workspace outside the browser.',
    actionLabel: 'Download current JSON',
  };
}
