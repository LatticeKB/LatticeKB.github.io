import { normalizeCorpus } from '../../corpus/lib/normalizeCorpus';
import { validateCorpus } from '../../corpus/lib/validators';
import type { CorpusFile } from '../../corpus/model/types';
import type { CorpusSyncState } from '../../../pages/workspace/model/corpusSync';
import { openLatticeDatabase, WORKSPACE_STORE_NAME } from './browserDatabase';

const ACTIVE_WORKSPACE_KEY = 'active-workspace';

export type PersistedWorkspaceState = {
  corpus: CorpusFile;
  corpusName: string;
  selectedEntryId: string | null;
  corpusSyncState: CorpusSyncState;
};

function isPersistedWorkspaceState(candidate: unknown): candidate is PersistedWorkspaceState {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }

  const value = candidate as Partial<PersistedWorkspaceState>;
  return typeof value.corpusName === 'string'
    && (typeof value.selectedEntryId === 'string' || value.selectedEntryId === null)
    && typeof value.corpusSyncState === 'object'
    && value.corpusSyncState !== null
    && typeof value.corpusSyncState.baselineSnapshot === 'string'
    && typeof value.corpusSyncState.baselineName === 'string'
    && (value.corpusSyncState.origin === 'sample' || value.corpusSyncState.origin === 'file' || value.corpusSyncState.origin === 'download')
    && typeof value.corpus === 'object'
    && value.corpus !== null;
}

export async function saveWorkspaceState(state: PersistedWorkspaceState) {
  const database = await openLatticeDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WORKSPACE_STORE_NAME, 'readwrite');
    transaction.objectStore(WORKSPACE_STORE_NAME).put(state, ACTIVE_WORKSPACE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Unable to save active workspace.'));
  });
}

export async function readWorkspaceState() {
  const database = await openLatticeDatabase();
  return new Promise<PersistedWorkspaceState | null>((resolve, reject) => {
    const transaction = database.transaction(WORKSPACE_STORE_NAME, 'readonly');
    const request = transaction.objectStore(WORKSPACE_STORE_NAME).get(ACTIVE_WORKSPACE_KEY);
    request.onsuccess = () => {
      if (!isPersistedWorkspaceState(request.result)) {
        resolve(null);
        return;
      }

      try {
        resolve({
          ...request.result,
          corpus: normalizeCorpus(validateCorpus(request.result.corpus)),
        });
      } catch {
        resolve(null);
      }
    };
    request.onerror = () => reject(new Error('Unable to restore active workspace.'));
  });
}
