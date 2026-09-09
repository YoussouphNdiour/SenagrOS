'use client';

import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { Calendar, CheckCircle, Clock, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CalendrierKpis() {
  const t = useTranslations('calendrier');
  const { data } = trpc.calendar.kpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpiTemplates')}
        value={data?.totalTemplates ?? 0}
        icon={FileText}
        color="green"
      />
      <KpiCard
        title={t('kpiAssigned')}
        value={data?.totalAssigned ?? 0}
        icon={Calendar}
        color="blue"
      />
      <KpiCard
        title={t('kpiActive')}
        value={data?.active ?? 0}
        icon={Clock}
        color="orange"
      />
      <KpiCard
        title={t('kpiCompleted')}
        value={data?.completed ?? 0}
        icon={CheckCircle}
        color="green"
      />
    </div>
  );
}
