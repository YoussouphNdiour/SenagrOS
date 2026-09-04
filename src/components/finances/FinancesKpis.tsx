'use client';

import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { formatFCFA } from '@/lib/validators/finance.validator';

export function FinancesKpis() {
  const { data } = trpc.finance.financeKpis.useQuery();

  const soldeNet = data?.soldeNet ?? 0;
  const revenus = data?.revenus ?? 0;
  const depenses = data?.depenses ?? 0;
  const pertes = data?.pertes ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Solde Net"
        value={formatFCFA(soldeNet)}
        icon={Wallet}
        color="green"
      />
      <KpiCard
        title="Revenus"
        value={formatFCFA(revenus)}
        icon={TrendingUp}
        color="green"
      />
      <KpiCard
        title="Dépenses"
        value={formatFCFA(depenses)}
        icon={TrendingDown}
        color="orange"
      />
      <KpiCard
        title="Pertes"
        value={formatFCFA(pertes)}
        icon={AlertTriangle}
        color="red"
      />
    </div>
  );
}
