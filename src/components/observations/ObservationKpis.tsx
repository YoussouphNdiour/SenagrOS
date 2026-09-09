'use client';

import { ClipboardList, Sprout, Bug, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';

export function ObservationKpis() {
  const t = useTranslations('observations');
  const { data } = trpc.observation.kpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpiTotal')}
        value={data?.total ?? 0}
        icon={ClipboardList}
        color="green"
      />
      <KpiCard
        title={t('kpiDensity')}
        value={data?.density ?? 0}
        icon={Sprout}
        color="blue"
      />
      <KpiCard
        title={t('kpiPest')}
        value={data?.pest ?? 0}
        icon={Bug}
        color="orange"
      />
      <KpiCard
        title={t('kpiGrading')}
        value={data?.grading ?? 0}
        icon={Award}
        color="purple"
      />
    </div>
  );
}
