'use client';

import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Hide after the app is installed
  useEffect(() => {
    function handleAppInstalled() {
      setDeferredPrompt(null);
    }

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
  }

  if (!deferredPrompt || dismissed) return null;

  return (
    <div
      role="banner"
      className="flex items-center justify-between gap-3 bg-green-700 px-4 py-3 text-white"
    >
      <div className="flex items-center gap-2 text-sm">
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Installez SenagrOS pour un accès hors ligne rapide.</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-md bg-white px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-white"
        >
          Installer
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer"
          className="rounded p-1 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
