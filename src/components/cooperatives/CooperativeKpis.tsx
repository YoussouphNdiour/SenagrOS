'use client';

import { Building2, MapPin, Wheat, Banknote } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { trpc } from '@/lib/trpc';

interface CooperativeKpisProps {
  cooperativeId: string;
}

function formatFCFA(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA';
}

export function CooperativeKpis({ cooperativeId }: CooperativeKpisProps) {
  const { data } = trpc.cooperative.dashboard.useQuery({ cooperativeId });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Fermes membres"
        value={data?.totalFarms ?? 0}
        icon={Building2}
        color="green"
      />
      <KpiCard
        title="Surface totale"
        value={`${(data?.totalSurfaceHa ?? 0).toFixed(1)} ha`}
        icon={MapPin}
        color="blue"
      />
      <KpiCard
        title="Production totale"
        value={`${(data?.totalProductionKg ?? 0).toFixed(0)} kg`}
        icon={Wheat}
        color="orange"
      />
      <KpiCard
        title="CA total"
        value={formatFCFA(data?.totalRevenueXof ?? 0)}
        icon={Banknote}
        color="purple"
      />
    </div>
  );
}
