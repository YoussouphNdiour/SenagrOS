'use client';

import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';
import { ClipboardList, CheckCircle, Clock, XCircle } from 'lucide-react';

export function PlanKpis() {
  const { data } = trpc.plan.kpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total plans"
        value={data?.total ?? 0}
        icon={ClipboardList}
        color="green"
      />
      <KpiCard
        title="Actifs"
        value={data?.active ?? 0}
        icon={Clock}
        color="blue"
      />
      <KpiCard
        title="Terminés"
        value={data?.completed ?? 0}
        icon={CheckCircle}
        color="green"
      />
      <KpiCard
        title="Annulés"
        value={data?.cancelled ?? 0}
        icon={XCircle}
        color="orange"
      />
    </div>
  );
}
