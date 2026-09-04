import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Shared mutable state for the mock queue — declared before vi.mock so the
// factory closure can capture the references.
const _mutations: Array<{ id: string; timestamp: number; procedure: string; input: unknown }> = [];
let _nextId = 1;

const mockQueue = {
  enqueue: vi.fn(async ({ procedure, input }: { procedure: string; input: unknown }) => {
    const id = `mock-id-${_nextId++}`;
    _mutations.push({ id, timestamp: Date.now(), procedure, input });
    return id;
  }),
  dequeueAll: vi.fn(async () => [..._mutations]),
  remove: vi.fn(async (id: string) => {
    const idx = _mutations.findIndex((m) => m.id === id);
    if (idx !== -1) _mutations.splice(idx, 1);
  }),
  count: vi.fn(async () => _mutations.length),
  clear: vi.fn(async () => {
    _mutations.length = 0;
  }),
};

// Mock the sync-queue module so tests don't require IndexedDB.
// The factory must export proper constructor functions (not arrow fns).
vi.mock('@/lib/offline/sync-queue', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: mock constructor
  IndexedDBSyncQueue: function IndexedDBSyncQueue() {
    return mockQueue;
  },
  // biome-ignore lint/suspicious/noEmptyBlockStatements: mock constructor
  OfflineSyncQueue: function OfflineSyncQueue() {
    return mockQueue;
  },
}));

import { useOfflineSync } from './useOfflineSync';

// Helper to control navigator.onLine
function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true, writable: true });
}

function resetMockQueue() {
  _mutations.length = 0;
  _nextId = 1;
  mockQueue.enqueue.mockImplementation(
    async ({ procedure, input }: { procedure: string; input: unknown }) => {
      const id = `mock-id-${_nextId++}`;
      _mutations.push({ id, timestamp: Date.now(), procedure, input });
      return id;
    },
  );
  mockQueue.dequeueAll.mockImplementation(async () => [..._mutations]);
  mockQueue.remove.mockImplementation(async (id: string) => {
    const idx = _mutations.findIndex((m) => m.id === id);
    if (idx !== -1) _mutations.splice(idx, 1);
  });
  mockQueue.count.mockImplementation(async () => _mutations.length);
  mockQueue.clear.mockImplementation(async () => {
    _mutations.length = 0;
  });
}

describe('useOfflineSync', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setOnline(true);
    resetMockQueue();
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ result: { data: { json: { id: '1' } } } }), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns isOnline=true when navigator.onLine is true', () => {
    setOnline(true);
    const { result } = renderHook(() => useOfflineSync());
    expect(result.current.isOnline).toBe(true);
  });

  it('returns isOnline=false when navigator.onLine is false', () => {
    setOnline(false);
    const { result } = renderHook(() => useOfflineSync());
    expect(result.current.isOnline).toBe(false);
  });

  it('updates isOnline when network events fire', () => {
    setOnline(true);
    const { result } = renderHook(() => useOfflineSync());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('exposes enqueue that delegates to the sync queue', async () => {
    const { result } = renderHook(() => useOfflineSync());
    let id: string | undefined;

    await act(async () => {
      id = await result.current.enqueue({ procedure: 'log.create', input: { type: 'harvest' } });
    });

    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('exposes pendingCount that reflects queue size', async () => {
    const { result } = renderHook(() => useOfflineSync());

    await waitFor(() => expect(result.current.pendingCount).toBe(0));

    await act(async () => {
      await result.current.enqueue({ procedure: 'log.create', input: {} });
    });

    await waitFor(() => expect(result.current.pendingCount).toBe(1));
  });

  it('replays queued mutations via fetch when coming back online', async () => {
    setOnline(false);
    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.enqueue({ procedure: 'log.create', input: { type: 'seeding' } });
    });

    await act(async () => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/trpc/log.create');
    expect(options?.method).toBe('POST');
  });

  it('removes a mutation from the queue after successful replay', async () => {
    setOnline(false);
    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.enqueue({ procedure: 'log.update', input: { id: '42' } });
    });

    await act(async () => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(result.current.pendingCount).toBe(0));
  });

  it('exposes isSyncing=true while sync is in progress', async () => {
    let resolveFetch!: () => void;
    fetchSpy.mockReturnValueOnce(
      new Promise<Response>((res) => {
        resolveFetch = () =>
          res(new Response(JSON.stringify({ result: { data: {} } }), { status: 200 }));
      }),
    );

    setOnline(false);
    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.enqueue({ procedure: 'log.create', input: {} });
    });

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(true));

    await act(async () => {
      resolveFetch();
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(false));
  });

  it('exposes syncErrors when a mutation replay fails', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network failure'));

    setOnline(false);
    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.enqueue({ procedure: 'log.create', input: {} });
    });

    await act(async () => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(result.current.syncErrors.length).toBeGreaterThan(0));
    expect(result.current.syncErrors[0]).toBeInstanceOf(Error);
  });
});
