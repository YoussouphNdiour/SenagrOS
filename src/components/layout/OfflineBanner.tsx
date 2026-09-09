'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useTranslations } from 'next-intl';
import { RefreshCw, WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();
  const t = useTranslations('pwa');

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
          {t('syncing')}
          {pendingCount > 0 && ` — ${pendingCount} ${t('pending')}`}
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
        {t('offline')}
        {pendingCount > 0 && ` — ${pendingCount} ${t('pendingSync')}`}
      </span>
    </div>
  );
}
