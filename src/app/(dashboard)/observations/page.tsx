import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ObservationKpis } from '@/components/observations/ObservationKpis';
import { ObservationListClient } from '@/components/observations/ObservationListClient';

export default async function ObservationsPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fiches d'observation</h1>
          <p className="text-sm text-gray-500">
            Densité de levée, stades culturaux, maladies-ravageurs, agréage
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/observations/density/new"
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            + Densité
          </Link>
          <Link
            href="/observations/stage/new"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            + Stade
          </Link>
          <Link
            href="/observations/pest/new"
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 transition"
          >
            + Ravageurs
          </Link>
          <Link
            href="/observations/grading/new"
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 transition"
          >
            + Agréage
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <ObservationKpis />
      </div>

      <ObservationListClient />
    </div>
  );
}
