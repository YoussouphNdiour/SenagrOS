'use client';

export default function CalendrierError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="mb-2 text-lg font-semibold text-gray-800">
        Erreur lors du chargement du calendrier
      </h2>
      <p className="mb-4 text-sm text-gray-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
      >
        Réessayer
      </button>
    </div>
  );
}
