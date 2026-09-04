import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { VentesKpis } from '@/components/finances/VentesKpis';
import { VenteListClient } from '@/components/finances/VenteListClient';

export default async function VentesPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ventes</h1>
          <p className="text-sm text-gray-500">
            Suivi du chiffre d'affaires et historique des ventes
          </p>
        </div>
        <Link
          href="/ventes/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          + Nouvelle vente
        </Link>
      </div>

      <div className="mb-6">
        <VentesKpis />
      </div>

      <VenteListClient />
    </div>
  );
}
