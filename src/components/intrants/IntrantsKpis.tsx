'use client';

import { Package, DollarSign, AlertTriangle, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';

export function IntrantsKpis() {
  const t = useTranslations('intrants');
  const { data } = trpc.inventory.kpis.useQuery();

  const formatXof = (value: number) =>
    new Intl.NumberFormat('fr-SN', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' FCFA';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpiTotalProducts')}
        value={data?.totalArticles ?? 0}
        icon={Package}
        color="green"
      />
      <KpiCard
        title={t('kpiStockValue')}
        value={data ? formatXof(data.valorisationTotal) : '—'}
        icon={DollarSign}
        color="blue"
      />
      <KpiCard
        title={t('kpiAlerts')}
        value={data?.alertCount ?? 0}
        icon={AlertTriangle}
        color="orange"
      />
      <KpiCard
        title={t('kpiCategories')}
        value={`${data?.phytoCount ?? 0} / ${data?.fertiCount ?? 0} / ${data?.semenceCount ?? 0}`}
        icon={Layers}
        color="purple"
      />
    </div>
  );
}
