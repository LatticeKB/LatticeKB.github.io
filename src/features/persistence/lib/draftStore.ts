import type { CorpusEntry } from '../../corpus/model/types';
import { DRAFT_STORE_NAME, openLatticeDatabase } from './browserDatabase';

export async function saveDraft(entry: CorpusEntry) {
  const database = await openLatticeDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, 'readwrite');
    transaction.objectStore(DRAFT_STORE_NAME).put(entry, entry.id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Unable to save draft.'));
  });
}

export async function readDraft(id: string) {
  const database = await openLatticeDatabase();
  return new Promise<CorpusEntry | null>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, 'readonly');
    const request = transaction.objectStore(DRAFT_STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as CorpusEntry | undefined) ?? null);
    request.onerror = () => reject(new Error('Unable to read draft.'));
  });
}

export async function clearDraft(id: string) {
  const database = await openLatticeDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, 'readwrite');
    transaction.objectStore(DRAFT_STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Unable to clear draft.'));
  });
}
