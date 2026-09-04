import { WifiOff } from 'lucide-react';

export const metadata = {
  title: 'Hors ligne — SenagrOS',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
          <WifiOff className="h-10 w-10 text-orange-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Vous êtes hors ligne
        </h1>
        <p className="mb-6 text-gray-600">
          Vérifiez votre connexion internet et réessayez.
          <br />
          Les données saisies hors ligne seront synchronisées au retour du réseau.
        </p>
        <OfflineRetryButton />
      </div>
    </div>
  );
}

function OfflineRetryButton() {
  // This is a Server Component — the button uses native browser behavior
  // via a simple form action that reloads the page
  return (
    <form action="/" method="GET">
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        Réessayer
      </button>
    </form>
  );
}
