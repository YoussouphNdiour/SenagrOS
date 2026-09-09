'use client';

import { MapPin, Ruler, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';

interface LandKpisProps {
  farmId: string;
}

export function LandKpis({ farmId }: LandKpisProps) {
  const t = useTranslations('assets');
  const { data } = trpc.asset.list.useQuery({
    farmId,
    type: 'land',
    limit: 100,
  });

  const items = data?.items ?? [];
  const total = items.length;
  const active = items.filter((a: unknown) => {
    const asset = a as Record<string, unknown>;
    return asset.status === 'active';
  }).length;

  const totalSurface = items.reduce((sum: number, a: unknown) => {
    const asset = a as Record<string, unknown>;
    const d = asset.data as Record<string, unknown> | null;
    const surface = d && typeof d === 'object' && 'surface_ha' in d
      ? Number(d.surface_ha) || 0
      : 0;
    return sum + surface;
  }, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard
        title={t('kpiTotalParcelles')}
        value={total}
        icon={MapPin}
        color="green"
      />
      <KpiCard
        title={t('kpiSurface')}
        value={totalSurface.toFixed(2)}
        icon={Ruler}
        color="blue"
      />
      <KpiCard
        title={t('kpiActiveParcelles')}
        value={active}
        icon={CheckCircle}
        color="orange"
      />
    </div>
  );
}
