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
      <p className="text-lg font-semibold text-gray-800">Une erreur est survenue</p>
      <p className="text-sm text-gray-500">Le service est momentanément indisponible.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
