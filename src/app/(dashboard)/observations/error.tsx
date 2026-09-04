'use client';

export default function ObservationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-red-600">Erreur : {error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
      >
        Réessayer
      </button>
    </div>
  );
}
