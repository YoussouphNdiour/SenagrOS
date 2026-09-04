import { describe, it, expect, beforeEach } from 'vitest';
import { OfflineSyncQueue, type QueuedMutation } from './sync-queue';

// In-memory mock for IndexedDB — OfflineSyncQueue accepts a storage adapter
// so we can test without a real IndexedDB

describe('OfflineSyncQueue', () => {
  let queue: OfflineSyncQueue;

  beforeEach(() => {
    queue = new OfflineSyncQueue();
    // Clear any previous state
  });

  it('enqueues a mutation and returns an ID', async () => {
    const id = await queue.enqueue({
      procedure: 'log.create',
      input: { type: 'harvest', notes: 'Test' },
    });
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('counts pending mutations', async () => {
    expect(await queue.count()).toBe(0);
    await queue.enqueue({ procedure: 'log.create', input: {} });
    await queue.enqueue({ procedure: 'log.update', input: {} });
    expect(await queue.count()).toBe(2);
  });

  it('dequeues all mutations in FIFO order', async () => {
    await queue.enqueue({ procedure: 'first', input: { order: 1 } });
    await queue.enqueue({ procedure: 'second', input: { order: 2 } });
    await queue.enqueue({ procedure: 'third', input: { order: 3 } });

    const all = await queue.dequeueAll();
    expect(all).toHaveLength(3);
    expect(all[0].procedure).toBe('first');
    expect(all[1].procedure).toBe('second');
    expect(all[2].procedure).toBe('third');
  });

  it('dequeued mutations have timestamp', async () => {
    const before = Date.now();
    await queue.enqueue({ procedure: 'log.create', input: {} });
    const after = Date.now();

    const all = await queue.dequeueAll();
    expect(all[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(all[0].timestamp).toBeLessThanOrEqual(after);
  });

  it('removes a mutation by ID', async () => {
    const id1 = await queue.enqueue({ procedure: 'keep', input: {} });
    const id2 = await queue.enqueue({ procedure: 'remove', input: {} });

    await queue.remove(id2);

    const all = await queue.dequeueAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(id1);
    expect(all[0].procedure).toBe('keep');
  });

  it('clears all mutations', async () => {
    await queue.enqueue({ procedure: 'a', input: {} });
    await queue.enqueue({ procedure: 'b', input: {} });
    await queue.clear();
    expect(await queue.count()).toBe(0);
  });

  it('preserves input data through enqueue/dequeue cycle', async () => {
    const input = {
      type: 'seeding',
      parcelId: '550e8400-e29b-41d4-a716-446655440000',
      sowingType: 'machine',
      depth: 5,
      notes: 'Semis haricot vert P-06',
    };
    await queue.enqueue({ procedure: 'log.create', input });

    const all = await queue.dequeueAll();
    expect(all[0].input).toEqual(input);
  });
});
