import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FinancesKpis } from '@/components/finances/FinancesKpis';
import { FinanceListClient } from '@/components/finances/FinanceListClient';

export default async function FinancesPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Finances</h1>
          <p className="text-sm text-gray-500">
            Revenus, dépenses, pertes et flux de trésorerie
          </p>
        </div>
        <Link
          href="/ventes/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          + Transaction
        </Link>
      </div>

      <div className="mb-6">
        <FinancesKpis />
      </div>

      <FinanceListClient />
    </div>
  );
}
