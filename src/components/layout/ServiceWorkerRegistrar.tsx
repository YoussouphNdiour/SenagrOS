'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';
import { setupAutoSync } from '@/lib/sync-queue';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker();
    setupAutoSync();
  }, []);

  return null;
}
