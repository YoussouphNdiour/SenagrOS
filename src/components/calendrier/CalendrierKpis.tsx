'use client';

import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { Calendar, CheckCircle, Clock, FileText } from 'lucide-react';

export function CalendrierKpis() {
  const { data } = trpc.calendar.kpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Modèles"
        value={data?.totalTemplates ?? 0}
        icon={FileText}
        color="green"
      />
      <KpiCard
        title="Parcelles assignées"
        value={data?.totalAssigned ?? 0}
        icon={Calendar}
        color="blue"
      />
      <KpiCard
        title="Cycles actifs"
        value={data?.active ?? 0}
        icon={Clock}
        color="orange"
      />
      <KpiCard
        title="Cycles terminés"
        value={data?.completed ?? 0}
        icon={CheckCircle}
        color="green"
      />
    </div>
  );
}
