import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IntrantsKpis } from '@/components/intrants/IntrantsKpis';
import { IntrantListClient } from '@/components/intrants/IntrantListClient';

export default async function SemencesPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Intrants</h1>
          <p className="text-sm text-gray-500">
            Gestion des produits phytosanitaires, engrais et semences
          </p>
        </div>
        <Link
          href="/intrants/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          + Nouveau
        </Link>
      </div>

      <div className="mb-6">
        <IntrantsKpis />
      </div>

      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <Link
          href="/intrants/phyto"
          className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-600 hover:border-green-500 hover:text-green-700 transition"
        >
          Phytosanitaire
        </Link>
        <Link
          href="/intrants/ferti"
          className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-600 hover:border-green-500 hover:text-green-700 transition"
        >
          Fertilisation
        </Link>
        <Link
          href="/intrants/semences"
          className="border-b-2 border-green-600 px-4 py-2 text-sm font-medium text-green-700"
        >
          Semences
        </Link>
      </div>

      <IntrantListClient category="semence" />
    </div>
  );
}
