import type { CorpusEntry } from '../../corpus/model/types';

const DATABASE_NAME = 'latticekb';
const STORE_NAME = 'drafts';
const DATABASE_VERSION = 1;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(new Error('Unable to open draft store.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveDraft(entry: CorpusEntry) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(entry, entry.id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Unable to save draft.'));
  });
}

export async function readDraft(id: string) {
  const database = await openDatabase();
  return new Promise<CorpusEntry | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as CorpusEntry | undefined) ?? null);
    request.onerror = () => reject(new Error('Unable to read draft.'));
  });
}

export async function clearDraft(id: string) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Unable to clear draft.'));
  });
}
