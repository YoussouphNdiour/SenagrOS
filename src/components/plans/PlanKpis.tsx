'use client';

import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { ClipboardList, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PlanKpis() {
  const t = useTranslations('plans');
  const { data } = trpc.plan.kpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpiTotal')}
        value={data?.total ?? 0}
        icon={ClipboardList}
        color="green"
      />
      <KpiCard
        title={t('kpiActive')}
        value={data?.active ?? 0}
        icon={Clock}
        color="blue"
      />
      <KpiCard
        title={t('kpiCompleted')}
        value={data?.completed ?? 0}
        icon={CheckCircle}
        color="green"
      />
      <KpiCard
        title={t('statusCancelled')}
        value={data?.cancelled ?? 0}
        icon={XCircle}
        color="orange"
      />
    </div>
  );
}
