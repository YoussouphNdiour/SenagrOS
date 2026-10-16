'use client';

import Link from 'next/link';

export default function StorefrontError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-lg font-semibold text-ink">Une erreur est survenue</p>
      <p className="text-sm text-muted">Le service est momentanément indisponible.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-md border border-line px-4 py-2 text-sm text-ink"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
