/**
 * Service Worker registration utility.
 * Call once on app mount (e.g. in a client layout or useEffect).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
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
