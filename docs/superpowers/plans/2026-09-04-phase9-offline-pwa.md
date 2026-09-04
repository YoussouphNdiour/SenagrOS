# Phase 9: Offline / PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SenagrOS installable as a PWA with offline support — cache static assets, queue mutations when offline, replay them when the network returns, and show clear UI feedback.

**Architecture:** `@serwist/next` wraps the Next.js config and generates a ServiceWorker from `src/app/sw.ts`. Cache strategies are declared there (CacheFirst for assets, NetworkFirst for tRPC). An `OfflineSyncQueue` class stores pending mutations in IndexedDB and replays them FIFO on reconnect. A React hook `useOfflineSync` exposes online state and pending count to UI components (`OfflineBanner`, `InstallPrompt`).

**Tech Stack:** `@serwist/next` + `serwist` (ServiceWorker), native IndexedDB API (sync queue), Next.js Metadata API (`manifest.ts`), Vitest (unit tests), Playwright (E2E offline tests)

**Spec:** `docs/02_features.md` (F15.1), `docs/06_decision_token.md` (DT-013, DT-OPEN-001), `docs/11_rebuild_plan.md` (Phase 9)

## Global Constraints

- Next.js 16.3.4 with App Router — `'use client'` required for interactive components
- TypeScript strict mode — no `any`, use `unknown`
- Path alias `@/` → `src/`
- Tailwind CSS v4 — utility classes only, green palette
- Biome for lint/format — must pass `pnpm lint`
- pnpm package manager
- Conventional commits: `feat:`, `fix:`, `chore:`
- All tests must pass: `pnpm typecheck`, `pnpm lint`, `pnpm test`

---

### Task 1: Install dependencies and configure ServiceWorker

**Files:**
- Modify: `package.json` (add `@serwist/next`, `serwist`)
- Modify: `next.config.ts` (wrap with `withSerwist`)
- Create: `src/app/sw.ts` (ServiceWorker entry point)
- Modify: `tsconfig.json` (add `WebWorker` lib for SW types)
- Modify: `.gitignore` (ignore generated SW files)

**Interfaces:**
- Consumes: nothing
- Produces: A working ServiceWorker that caches static assets (CacheFirst), pages (StaleWhileRevalidate), and tRPC calls (NetworkFirst), with an offline fallback page.

- [ ] **Step 1: Install serwist packages**

```bash
pnpm add @serwist/next serwist
```

- [ ] **Step 2: Add `WebWorker` lib to tsconfig.json**

In `tsconfig.json`, add `"webworker"` to the `lib` array so ServiceWorker types are available:

```json
"lib": ["dom", "dom.iterable", "esnext", "webworker"]
```

- [ ] **Step 3: Add generated SW files to .gitignore**

Append to `.gitignore`:

```
# Serwist generated SW
public/sw.js
public/sw.js.map
public/serwist-precache-manifest.*.js
```

- [ ] **Step 4: Create the ServiceWorker entry point**

Create `src/app/sw.ts`:

```ts
import { defaultCache } from '@serwist/next/worker';
import { type PrecacheEntry, type SerwistGlobalConfig, Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
```

- [ ] **Step 5: Wrap next.config.ts with withSerwist**

Replace `next.config.ts` content:

```ts
import withSerwist from '@serwist/next';

const nextConfig = {};

export default withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
```

Note: `disable: process.env.NODE_ENV === 'development'` prevents the SW from interfering during dev. The SW only activates in production builds.

- [ ] **Step 6: Verify the build compiles**

```bash
pnpm typecheck
```

Expected: PASS (no type errors from SW file)

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts src/app/sw.ts tsconfig.json .gitignore
git commit -m "feat(pwa): configure @serwist/next ServiceWorker with cache strategies"
```

---

### Task 2: PWA Manifest and app icons

**Files:**
- Create: `src/app/manifest.ts` (PWA manifest via Next.js Metadata API)
- Create: `public/icons/icon-192x192.svg` (app icon 192)
- Create: `public/icons/icon-512x512.svg` (app icon 512)
- Modify: `src/app/layout.tsx` (add `<meta name="theme-color">` and viewport meta)

**Interfaces:**
- Consumes: nothing
- Produces: `/manifest.webmanifest` served by Next.js with correct PWA metadata and icons.

- [ ] **Step 1: Create SVG app icons**

Create `public/icons/icon-192x192.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="none">
  <rect width="192" height="192" rx="32" fill="#16a34a"/>
  <text x="96" y="120" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="bold" fill="white">SA</text>
</svg>
```

Create `public/icons/icon-512x512.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="64" fill="#16a34a"/>
  <text x="256" y="310" text-anchor="middle" font-family="Arial,sans-serif" font-size="192" font-weight="bold" fill="white">SA</text>
</svg>
```

- [ ] **Step 2: Create manifest.ts**

Create `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SenagrOS — Système de Gestion Agricole',
    short_name: 'SenagrOS',
    description: 'FMIS open-source pour les exploitations agricoles d\'Afrique de l\'Ouest',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
}
```

- [ ] **Step 3: Add theme-color meta to root layout**

In `src/app/layout.tsx`, update the `metadata` export:

```ts
export const metadata: Metadata = {
  title: 'SenagrOS — Système de Gestion Agricole',
  description: 'FMIS open-source pour les exploitations agricoles d\'Afrique de l\'Ouest',
  other: {
    'theme-color': '#16a34a',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SenagrOS',
  },
};
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/manifest.ts public/icons/ src/app/layout.tsx
git commit -m "feat(pwa): add PWA manifest with app icons and theme-color meta"
```

---

### Task 3: Offline page

**Files:**
- Create: `src/app/offline/page.tsx` (offline fallback page — outside `(dashboard)` group, no auth required)

**Interfaces:**
- Consumes: nothing (standalone page)
- Produces: `/offline` page that the ServiceWorker redirects to when no cache and no network

- [ ] **Step 1: Create the offline page**

Create `src/app/offline/page.tsx`:

```tsx
import { WifiOff } from 'lucide-react';

export const metadata = {
  title: 'Hors ligne — SenagrOS',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
          <WifiOff className="h-10 w-10 text-orange-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Vous êtes hors ligne
        </h1>
        <p className="mb-6 text-gray-600">
          Vérifiez votre connexion internet et réessayez.
          <br />
          Les données saisies hors ligne seront synchronisées au retour du réseau.
        </p>
        <OfflineRetryButton />
      </div>
    </div>
  );
}

function OfflineRetryButton() {
  // This is a Server Component — the button uses native browser behavior
  // via a simple form action that reloads the page
  return (
    <form action="/" method="GET">
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        Réessayer
      </button>
    </form>
  );
}
```

Note: The retry button is a simple form submit to `/` which works without JavaScript. No `'use client'` needed.

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/offline/page.tsx
git commit -m "feat(pwa): add /offline fallback page"
```

---

### Task 4: Offline sync queue (IndexedDB)

**Files:**
- Create: `src/lib/offline/sync-queue.ts` (OfflineSyncQueue class)
- Create: `src/lib/offline/sync-queue.test.ts` (unit tests)

**Interfaces:**
- Consumes: nothing
- Produces: `OfflineSyncQueue` class with methods:
  - `enqueue(mutation: { procedure: string; input: unknown }): Promise<string>` — stores a mutation, returns its ID
  - `dequeueAll(): Promise<QueuedMutation[]>` — returns all pending mutations in FIFO order
  - `remove(id: string): Promise<void>` — removes a mutation by ID
  - `count(): Promise<number>` — returns the number of pending mutations
  - `clear(): Promise<void>` — removes all mutations
- Also produces type `QueuedMutation = { id: string; timestamp: number; procedure: string; input: unknown }`

- [ ] **Step 1: Write failing tests for the sync queue**

Create `src/lib/offline/sync-queue.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/lib/offline/sync-queue.test.ts
```

Expected: FAIL — module `./sync-queue` not found

- [ ] **Step 3: Implement OfflineSyncQueue**

Create `src/lib/offline/sync-queue.ts`:

```ts
export interface QueuedMutation {
  id: string;
  timestamp: number;
  procedure: string;
  input: unknown;
}

/**
 * In-memory sync queue for offline mutations.
 * In the browser, this is backed by IndexedDB via the SyncQueueDB subclass.
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test src/lib/offline/sync-queue.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/offline/sync-queue.ts src/lib/offline/sync-queue.test.ts
git commit -m "feat(pwa): add OfflineSyncQueue with IndexedDB backend and unit tests"
```

---

### Task 5: useOfflineSync React hook

**Files:**
- Create: `src/hooks/useOfflineSync.ts` (React hook for offline state + sync)
- Create: `src/hooks/useOfflineSync.test.ts` (unit tests)

**Interfaces:**
- Consumes: `IndexedDBSyncQueue` from `@/lib/offline/sync-queue`
- Produces: `useOfflineSync()` hook returning:
  - `isOnline: boolean`
  - `pendingCount: number`
  - `queueMutation(procedure: string, input: unknown): Promise<void>`
  - `isSyncing: boolean`

- [ ] **Step 1: Write failing test**

Create `src/hooks/useOfflineSync.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the sync queue module before importing the hook
vi.mock('@/lib/offline/sync-queue', () => {
  const mutations: Array<{ id: string; procedure: string; input: unknown; timestamp: number }> = [];
  return {
    IndexedDBSyncQueue: vi.fn().mockImplementation(() => ({
      enqueue: vi.fn(async (m: { procedure: string; input: unknown }) => {
        const id = `mock-${mutations.length}`;
        mutations.push({ id, ...m, timestamp: Date.now() });
        return id;
      }),
      dequeueAll: vi.fn(async () => [...mutations]),
      remove: vi.fn(async (id: string) => {
        const idx = mutations.findIndex((m) => m.id === id);
        if (idx >= 0) mutations.splice(idx, 1);
      }),
      count: vi.fn(async () => mutations.length),
      clear: vi.fn(async () => { mutations.length = 0; }),
    })),
    OfflineSyncQueue: vi.fn(),
  };
});

import { renderHook, act } from '@testing-library/react';
import { useOfflineSync } from './useOfflineSync';

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('returns isOnline true when navigator.onLine is true', () => {
    const { result } = renderHook(() => useOfflineSync());
    expect(result.current.isOnline).toBe(true);
  });

  it('returns isOnline false when navigator.onLine is false', () => {
    vi.stubGlobal('navigator', { onLine: false });
    const { result } = renderHook(() => useOfflineSync());
    expect(result.current.isOnline).toBe(false);
  });

  it('queues a mutation and increments pendingCount', async () => {
    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.queueMutation('log.create', { type: 'harvest' });
    });

    expect(result.current.pendingCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/hooks/useOfflineSync.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useOfflineSync.ts`:

```ts
'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { IndexedDBSyncQueue } from '@/lib/offline/sync-queue';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function useOfflineSync() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const queueRef = useRef<IndexedDBSyncQueue | null>(null);

  // Initialize queue once on client
  if (typeof window !== 'undefined' && !queueRef.current) {
    queueRef.current = new IndexedDBSyncQueue();
  }

  const refreshCount = useCallback(async () => {
    if (queueRef.current) {
      const c = await queueRef.current.count();
      setPendingCount(c);
    }
  }, []);

  // Refresh count on mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Sync when coming back online
  useEffect(() => {
    if (!isOnline || !queueRef.current) return;

    let cancelled = false;

    async function replayQueue() {
      const queue = queueRef.current;
      if (!queue) return;

      const mutations = await queue.dequeueAll();
      if (mutations.length === 0) return;

      setIsSyncing(true);

      for (const mutation of mutations) {
        if (cancelled) break;
        try {
          const response = await fetch('/api/trpc/' + mutation.procedure, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: mutation.input }),
          });

          if (response.ok) {
            await queue.remove(mutation.id);
          }
          // If not ok, leave in queue for next retry
        } catch {
          // Network error — stop replaying, will retry next time
          break;
        }
      }

      if (!cancelled) {
        setIsSyncing(false);
        await refreshCount();
      }
    }

    replayQueue();

    return () => {
      cancelled = true;
    };
  }, [isOnline, refreshCount]);

  const queueMutation = useCallback(
    async (procedure: string, input: unknown) => {
      if (queueRef.current) {
        await queueRef.current.enqueue({ procedure, input });
        await refreshCount();
      }
    },
    [refreshCount],
  );

  return { isOnline, pendingCount, queueMutation, isSyncing };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test src/hooks/useOfflineSync.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useOfflineSync.ts src/hooks/useOfflineSync.test.ts
git commit -m "feat(pwa): add useOfflineSync hook with IndexedDB queue replay"
```

---

### Task 6: OfflineBanner and InstallPrompt UI components

**Files:**
- Create: `src/components/layout/OfflineBanner.tsx`
- Create: `src/components/layout/InstallPrompt.tsx`
- Modify: `src/components/layout/DashboardShell.tsx` (integrate OfflineBanner)

**Interfaces:**
- Consumes: `useOfflineSync()` from `@/hooks/useOfflineSync`
- Produces: `<OfflineBanner />` — yellow/orange banner shown when offline; `<InstallPrompt />` — install button capturing `beforeinstallprompt`

- [ ] **Step 1: Create OfflineBanner component**

Create `src/components/layout/OfflineBanner.tsx`:

```tsx
'use client';

import { WifiOff } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();

  if (isOnline && !isSyncing) return null;

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center gap-2 bg-blue-500 px-4 py-2 text-sm text-white">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <span>Synchronisation en cours... ({pendingCount} en attente)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-orange-500 px-4 py-2 text-sm text-white">
      <WifiOff className="h-4 w-4" />
      <span>
        Vous êtes hors ligne — les données seront synchronisées au retour du réseau
        {pendingCount > 0 && ` (${pendingCount} en attente)`}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create InstallPrompt component**

Create `src/components/layout/InstallPrompt.tsx`:

```tsx
'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled || !deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
    >
      <Download className="h-4 w-4" />
      Installer l&apos;application
    </button>
  );
}
```

- [ ] **Step 3: Integrate OfflineBanner into DashboardShell**

In `src/components/layout/DashboardShell.tsx`, add the import and the banner. The modified file should look like:

```tsx
'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';

interface DashboardShellProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <OfflineBanner />
        <Topbar user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/OfflineBanner.tsx src/components/layout/InstallPrompt.tsx src/components/layout/DashboardShell.tsx
git commit -m "feat(pwa): add OfflineBanner and InstallPrompt components"
```

---

### Task 7: E2E offline tests

**Files:**
- Create: `e2e/offline.spec.ts` (Playwright E2E test for offline behavior)

**Interfaces:**
- Consumes: Running app with ServiceWorker enabled (production build)
- Produces: E2E test verifying offline banner appears, offline page loads, and sync happens

- [ ] **Step 1: Create E2E test file**

Create `e2e/offline.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Offline / PWA', () => {
  test('shows offline banner when network is lost', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@senagros.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Go offline
    await context.setOffline(true);

    // Trigger a navigation or wait for the banner
    await page.waitForTimeout(1000);

    // The offline banner should appear
    const banner = page.locator('text=Vous êtes hors ligne');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Go back online
    await context.setOffline(false);

    // Banner should disappear
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });

  test('shows /offline page when navigating without cache', async ({ page, context }) => {
    // Go offline before any page loads
    await context.setOffline(true);

    // Try to navigate to a page that's not cached
    await page.goto('/offline');

    // Should show the offline page content
    await expect(page.locator('text=Vous êtes hors ligne')).toBeVisible();
    await expect(page.locator('text=Réessayer')).toBeVisible();
  });

  test('manifest.webmanifest is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe('SenagrOS — Système de Gestion Agricole');
    expect(manifest.short_name).toBe('SenagrOS');
    expect(manifest.theme_color).toBe('#16a34a');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Verify the test file has no syntax errors**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add e2e/offline.spec.ts
git commit -m "test(pwa): add E2E tests for offline banner, /offline page, and manifest"
```

Note: The E2E tests require a running dev/prod server. Run with `pnpm test:e2e` after `pnpm build && pnpm start`.

---

### Task 8: Final verification and docs update

**Files:**
- Modify: `docs/11_rebuild_plan.md` (check off Phase 9 livrables)
- Modify: `docs/16_decisions.md` (add SESSION-010 entry)
- Modify: `docs/06_decision_token.md` (close DT-OPEN-001)

**Interfaces:**
- Consumes: All previous tasks completed
- Produces: Updated documentation, all checks passing

- [ ] **Step 1: Run all verification commands**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: All PASS

- [ ] **Step 2: Update 11_rebuild_plan.md — check off Phase 9 livrables**

Replace the Phase 9 section in `docs/11_rebuild_plan.md`:

```markdown
## Phase 9 : Offline / PWA (1 session)

### Livrables
- [x] ServiceWorker avec cache-first
- [x] Queue de sync mutations offline (IndexedDB)
- [x] OfflineBanner
- [x] Page `/offline`
- [x] Manifest PWA (install prompt)
- [x] Tests offline
```

- [ ] **Step 3: Update 16_decisions.md — add SESSION-010**

Append before the final `*Ajouter une entree...` line in `docs/16_decisions.md`:

```markdown
## SESSION-010 — 2026-09-04 — Phase 9 : Offline / PWA

**Decisions prises :**
1. `@serwist/next` plutot que `next-pwa` — `next-pwa` est en maintenance-only, `@serwist/next` est son successeur actif et compatible Next.js 15+/16
2. ServiceWorker dans `src/app/sw.ts` avec `defaultCache` + fallback `/offline` — Strategies de cache par defaut de Serwist (CacheFirst assets, NetworkFirst API), fallback page pour les documents sans cache
3. `OfflineSyncQueue` avec 2 implementations (in-memory + IndexedDB) — La classe de base in-memory est testable sans IndexedDB (Vitest/jsdom), `IndexedDBSyncQueue` herite et surcharge pour le browser
4. `useOfflineSync` hook avec `useSyncExternalStore` pour l'etat online — Pattern React 18+ recommande pour synchroniser l'etat externe (navigator.onLine) avec le rendu
5. Replay FIFO des mutations via fetch vers `/api/trpc/{procedure}` — Simple et suffisant pour le MVP, coherent avec la decision DT-OPEN-001 option (a)
6. Last-write-wins pour les conflits — MVP ne necessite pas de CRDT, suffisant pour un utilisateur unique par ferme
7. `manifest.ts` via Next.js Metadata API (pas de fichier JSON statique) — Type-safe, genere automatiquement `/manifest.webmanifest`
8. Icones SVG placeholder (initiales "SA" sur fond vert) — Suffisant pour le MVP, remplaceables par de vraies icones plus tard
9. ServiceWorker desactive en dev (`disable: process.env.NODE_ENV === 'development'`) — Evite les problemes de cache pendant le developpement
10. Page `/offline` en dehors du route group `(dashboard)` — Pas d'auth requise pour la page de fallback offline

**Problemes rencontres :**
1. (A remplir pendant l'implementation)

**Livrables completes :**
1. `next.config.ts` — Configure avec `withSerwist()` pour generer le ServiceWorker
2. `src/app/sw.ts` — ServiceWorker avec precache, runtime cache, et fallback offline
3. `src/app/manifest.ts` — Manifest PWA (nom, icones, theme_color, display standalone)
4. `public/icons/icon-192x192.svg` + `icon-512x512.svg` — Icones PWA placeholder
5. `src/app/offline/page.tsx` — Page fallback offline avec icone WifiOff et bouton Reessayer
6. `src/lib/offline/sync-queue.ts` — OfflineSyncQueue (in-memory) + IndexedDBSyncQueue (browser)
7. `src/hooks/useOfflineSync.ts` — Hook React (isOnline, pendingCount, queueMutation, isSyncing)
8. `src/components/layout/OfflineBanner.tsx` — Bandeau orange offline + bleu syncing
9. `src/components/layout/InstallPrompt.tsx` — Bouton install PWA (beforeinstallprompt)
10. `src/components/layout/DashboardShell.tsx` — Modifie pour integrer OfflineBanner
11. `src/lib/offline/sync-queue.test.ts` — 7 tests unitaires (enqueue, dequeue FIFO, remove, clear, data preservation)
12. `src/hooks/useOfflineSync.test.ts` — 3 tests unitaires (online state, offline state, queue mutation)
13. `e2e/offline.spec.ts` — 3 scenarios E2E (banner online/offline, page /offline, manifest)

**Prochaines etapes :**
1. Demarrer Phase 10 : i18n & Polish (traductions FR/EN/WO, responsive, recherche globale)
```

- [ ] **Step 4: Update 06_decision_token.md — close DT-OPEN-001**

Replace the `DT-OPEN-001` section in `docs/06_decision_token.md`:

```markdown
### DT-OPEN-001 : Strategie de sync offline — **FERMEE**
- **Date decision** : 2026-09-04
- **Choix** : (a) Queue simple (store mutations, replay au retour reseau)
- **Raison** : Suffisant pour le MVP avec un utilisateur par ferme. Last-write-wins pour les conflits. CRDT surdimensionne pour l'usage actuel.
- **Implementation** : `IndexedDBSyncQueue` dans `src/lib/offline/sync-queue.ts`, replay FIFO via `useOfflineSync` hook
```

- [ ] **Step 5: Commit**

```bash
git add docs/11_rebuild_plan.md docs/16_decisions.md docs/06_decision_token.md
git commit -m "docs: update Phase 9 livrables, decisions, and close DT-OPEN-001"
```
