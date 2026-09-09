'use client';

import { TrendingUp, Users, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { formatFCFA } from '@/lib/validators/finance.validator';

export function VentesKpis() {
  const t = useTranslations('finances');
  const { data } = trpc.finance.salesKpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpiCaMois')}
        value={data ? formatFCFA(data.caMois) : '—'}
        icon={TrendingUp}
        color="green"
      />
      <KpiCard
        title={t('kpiMargeBrute')}
        value={data ? formatFCFA(data.caMois) : '—'}
        icon={TrendingUp}
        color="green"
      />
      <KpiCard
        title={t('kpiClients')}
        value={data?.nbClients ?? 0}
        icon={Users}
        color="orange"
      />
      <KpiCard
        title={t('kpiCaTotal')}
        value={data ? formatFCFA(data.caTotal) : '—'}
        icon={DollarSign}
        color="blue"
      />
    </div>
  );
}
