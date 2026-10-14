/**
 * Service Worker registration utility.
 * Call once on app mount (e.g. in a client layout or useEffect).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  // In dev, public/sw.js is a stale build artifact whose cache-first strategy
  // serves outdated /_next/static chunks: remove it and its caches instead.
  if (process.env.NODE_ENV === 'development') {
    await unregisterServiceWorkers();
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // New service worker activated — could prompt user to refresh
            console.log('[SW] Nouvelle version disponible');
          }
        });
      }
    });

    console.log('[SW] Service Worker enregistre avec succes');
    return registration;
  } catch (error) {
    console.error('[SW] Echec de l\'enregistrement du Service Worker:', error);
    return undefined;
  }
}

/** Removes every registered service worker and Cache Storage entry for this origin. */
export async function unregisterServiceWorkers(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}
