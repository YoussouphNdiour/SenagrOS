'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4">
      <div className="text-center">
        <div className="mb-6 text-6xl font-bold text-green-700">SenagrOS</div>
        <h1 className="mb-4 text-2xl font-semibold text-gray-800">
          Vous etes hors ligne
        </h1>
        <p className="mb-8 text-gray-600">
          Verifiez votre connexion internet et reessayez.
        </p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}
