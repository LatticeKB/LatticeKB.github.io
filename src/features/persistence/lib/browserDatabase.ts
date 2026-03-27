export const LATTICE_DATABASE_NAME = 'latticekb';
export const LATTICE_DATABASE_VERSION = 2;
export const DRAFT_STORE_NAME = 'drafts';
export const WORKSPACE_STORE_NAME = 'workspace';

function ensureStore(database: IDBDatabase, storeName: string) {
  if (!database.objectStoreNames.contains(storeName)) {
    database.createObjectStore(storeName);
  }
}

export function openLatticeDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(LATTICE_DATABASE_NAME, LATTICE_DATABASE_VERSION);
    request.onerror = () => reject(new Error('Unable to open browser persistence.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      ensureStore(database, DRAFT_STORE_NAME);
      ensureStore(database, WORKSPACE_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
  });
}
