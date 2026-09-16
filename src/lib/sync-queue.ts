import { get, set, del, keys } from 'idb-keyval';

const QUEUE_PREFIX = 'sync-queue:';

export interface QueuedAction {
  id: string;
  url: string;
  method: string;
  body: string | null;
  timestamp: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Enqueue an action to be replayed when back online.
 */
export async function enqueue(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
  const entry: QueuedAction = {
    ...action,
    id: generateId(),
    timestamp: Date.now(),
  };
  await set(`${QUEUE_PREFIX}${entry.id}`, entry);
}

/**
 * Get the count of pending queued actions.
 */
export async function getPendingCount(): Promise<number> {
  const allKeys = await keys();
  return allKeys.filter((k) => String(k).startsWith(QUEUE_PREFIX)).length;
}

/**
 * Get all pending queued actions, sorted by timestamp.
 */
async function getPendingActions(): Promise<QueuedAction[]> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((k) => String(k).startsWith(QUEUE_PREFIX));

  const actions: QueuedAction[] = [];
  for (const key of queueKeys) {
    const action = await get<QueuedAction>(key);
    if (action) actions.push(action);
  }

  return actions.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Process all queued actions by replaying them via fetch.
 * Removes successfully replayed actions from the queue.
 * Returns the number of successfully processed actions.
 */
export async function processQueue(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  const actions = await getPendingActions();
  let processed = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: action.body,
      });

      if (response.ok) {
        await del(`${QUEUE_PREFIX}${action.id}`);
        processed++;
      } else {
        // Stop processing on server error to avoid out-of-order issues
        console.warn(`[SyncQueue] Echec de la requete ${action.id}: ${response.status}`);
        break;
      }
    } catch (error) {
      // Network error — stop processing, we're probably offline again
      console.warn('[SyncQueue] Erreur reseau, arret du traitement:', error);
      break;
    }
  }

  return processed;
}

/**
 * Set up automatic queue processing when coming back online.
 */
export function setupAutoSync(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('[SyncQueue] Connexion retablie, traitement de la file d\'attente...');
    const count = await processQueue();
    if (count > 0) {
      console.log(`[SyncQueue] ${count} action(s) synchronisee(s)`);
    }
  });
}
