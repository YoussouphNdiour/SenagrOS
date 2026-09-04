export interface QueuedMutation {
  id: string;
  timestamp: number;
  procedure: string;
  input: unknown;
}

/**
 * In-memory sync queue for offline mutations.
 * In the browser, this is backed by IndexedDB via the IndexedDBSyncQueue subclass.
 * The base class uses an in-memory Map for testing and SSR.
 */
export class OfflineSyncQueue {
  private store = new Map<string, QueuedMutation>();

  async enqueue(mutation: { procedure: string; input: unknown }): Promise<string> {
    const id = crypto.randomUUID();
    const entry: QueuedMutation = {
      id,
      timestamp: Date.now(),
      procedure: mutation.procedure,
      input: mutation.input,
    };
    this.store.set(id, entry);
    return id;
  }

  async dequeueAll(): Promise<QueuedMutation[]> {
    const entries = Array.from(this.store.values());
    entries.sort((a, b) => a.timestamp - b.timestamp);
    return entries;
  }

  async remove(id: string): Promise<void> {
    this.store.delete(id);
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

const DB_NAME = 'senagros-offline-queue';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;

/**
 * IndexedDB-backed sync queue for browser use.
 */
export class IndexedDBSyncQueue extends OfflineSyncQueue {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  private async tx(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest,
  ): Promise<unknown> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = fn(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  override async enqueue(mutation: { procedure: string; input: unknown }): Promise<string> {
    const id = crypto.randomUUID();
    const entry: QueuedMutation = {
      id,
      timestamp: Date.now(),
      procedure: mutation.procedure,
      input: mutation.input,
    };
    await this.tx('readwrite', (store) => store.put(entry));
    return id;
  }

  override async dequeueAll(): Promise<QueuedMutation[]> {
    const all = (await this.tx('readonly', (store) => store.getAll())) as QueuedMutation[];
    all.sort((a, b) => a.timestamp - b.timestamp);
    return all;
  }

  override async remove(id: string): Promise<void> {
    await this.tx('readwrite', (store) => store.delete(id));
  }

  override async count(): Promise<number> {
    return (await this.tx('readonly', (store) => store.count())) as number;
  }

  override async clear(): Promise<void> {
    await this.tx('readwrite', (store) => store.clear());
  }
}
