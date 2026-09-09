'use client';

import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { formatFCFA } from '@/lib/validators/finance.validator';

export function FinancesKpis() {
  const t = useTranslations('finances');
  const { data } = trpc.finance.financeKpis.useQuery();

  const soldeNet = data?.soldeNet ?? 0;
  const revenus = data?.revenus ?? 0;
  const depenses = data?.depenses ?? 0;
  const pertes = data?.pertes ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpiSoldeNet')}
        value={formatFCFA(soldeNet)}
        icon={Wallet}
        color="green"
      />
      <KpiCard
        title={t('kpiRevenus')}
        value={formatFCFA(revenus)}
        icon={TrendingUp}
        color="green"
      />
      <KpiCard
        title={t('kpiDepenses')}
        value={formatFCFA(depenses)}
        icon={TrendingDown}
        color="orange"
      />
      <KpiCard
        title={t('kpiPertes')}
        value={formatFCFA(pertes)}
        icon={AlertTriangle}
        color="red"
      />
    </div>
  );
}
