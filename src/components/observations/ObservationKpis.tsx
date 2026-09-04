'use client';

import { ClipboardList, Sprout, Bug, Award } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';

export function ObservationKpis() {
  const { data } = trpc.observation.kpis.useQuery();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total observations"
        value={data?.total ?? 0}
        icon={ClipboardList}
        color="green"
      />
      <KpiCard
        title="Densité de levée"
        value={data?.density ?? 0}
        icon={Sprout}
        color="blue"
      />
      <KpiCard
        title="Maladies-Ravageurs"
        value={data?.pest ?? 0}
        icon={Bug}
        color="orange"
      />
      <KpiCard
        title="Agréage qualité"
        value={data?.grading ?? 0}
        icon={Award}
        color="purple"
      />
    </div>
  );
}
