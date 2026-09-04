'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';
import { RefreshCw, WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();

  // Nothing to show when online and not syncing
  if (isOnline && !isSyncing) return null;

  if (isSyncing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-2 bg-blue-500 px-4 py-2 text-sm font-medium text-white"
      >
        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>
          Synchronisation en cours
          {pendingCount > 0 && ` — ${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente`}
        </span>
      </div>
    );
  }

  // Offline
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center justify-center gap-2 bg-orange-500 px-4 py-2 text-sm font-medium text-white"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <span>
        Hors ligne
        {pendingCount > 0 &&
          ` — ${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente de synchronisation`}
      </span>
    </div>
  );
}
