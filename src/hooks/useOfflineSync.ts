'use client';

import { IndexedDBSyncQueue, type OfflineSyncQueue } from '@/lib/offline/sync-queue';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// ---------------------------------------------------------------------------
// navigator.onLine via useSyncExternalStore
// ---------------------------------------------------------------------------

function subscribeToOnlineStatus(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseOfflineSyncReturn {
  /** Whether the browser currently reports a network connection */
  isOnline: boolean;
  /** Number of mutations waiting to be replayed */
  pendingCount: number;
  /** True while replaying queued mutations */
  isSyncing: boolean;
  /** Errors collected during the last sync attempt */
  syncErrors: Error[];
  /** Enqueue a mutation for offline replay */
  enqueue: (mutation: { procedure: string; input: unknown }) => Promise<string>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOfflineSync(): UseOfflineSyncReturn {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot,
  );

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState<Error[]>([]);

  // Lazily initialise the queue once per hook instance (not module-level,
  // so tests can replace IndexedDBSyncQueue via vi.mock before each render)
  const queueRef = useRef<OfflineSyncQueue | null>(null);
  if (queueRef.current === null) {
    queueRef.current = new IndexedDBSyncQueue();
  }
  const queue = queueRef.current;

  // Refresh pending count from the queue
  const refreshCount = useCallback(async () => {
    const count = await queue.count();
    setPendingCount(count);
  }, [queue]);

  // Load count on mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Replay queued mutations when coming back online
  useEffect(() => {
    if (!isOnline) return;

    let cancelled = false;

    async function sync() {
      const mutations = await queue.dequeueAll();
      if (mutations.length === 0) return;

      setIsSyncing(true);
      setSyncErrors([]);

      const errors: Error[] = [];

      for (const mutation of mutations) {
        if (cancelled) break;
        try {
          await fetch(`/api/trpc/${mutation.procedure}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: mutation.input }),
          });
          await queue.remove(mutation.id);
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
        }
      }

      if (!cancelled) {
        setSyncErrors(errors);
        setIsSyncing(false);
        await refreshCount();
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, [isOnline, queue, refreshCount]);

  const enqueue = useCallback(
    async (mutation: { procedure: string; input: unknown }): Promise<string> => {
      const id = await queue.enqueue(mutation);
      await refreshCount();
      return id;
    },
    [queue, refreshCount],
  );

  return { isOnline, pendingCount, isSyncing, syncErrors, enqueue };
}
