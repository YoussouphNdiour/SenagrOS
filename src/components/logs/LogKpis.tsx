'use client';

import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';

export function LogKpis() {
  const t = useTranslations('logs');
  const { data: allData } = trpc.log.list.useQuery({ limit: 1 });
  const { data: pendingData } = trpc.log.list.useQuery({ status: 'pending', limit: 1 });
  const { data: doneData } = trpc.log.list.useQuery({ status: 'done', limit: 1 });
  const { data: cancelledData } = trpc.log.list.useQuery({ status: 'cancelled', limit: 1 });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpiTotal')}
        value={allData?.total ?? 0}
        icon={ClipboardList}
        color="green"
      />
      <KpiCard
        title={t('kpiPending')}
        value={pendingData?.total ?? 0}
        icon={Clock}
        color="orange"
      />
      <KpiCard
        title={t('kpiDone')}
        value={doneData?.total ?? 0}
        icon={CheckCircle}
        color="blue"
      />
      <KpiCard
        title={t('kpiCancelled')}
        value={cancelledData?.total ?? 0}
        icon={XCircle}
        color="red"
      />
    </div>
  );
}
