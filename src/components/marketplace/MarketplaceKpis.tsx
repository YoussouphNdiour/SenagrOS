'use client';

import { Package, Store, Leaf } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { trpc } from '@/lib/trpc';

export function MarketplaceKpis() {
  const { data } = trpc.marketplace.marketplaceKpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Produits disponibles"
        value={data?.totalProducts ?? 0}
        icon={Package}
        color="green"
      />
      <KpiCard
        title="Fermes actives"
        value={data?.totalFarms ?? 0}
        icon={Store}
        color="blue"
      />
      <KpiCard
        title="Produits Bio"
        value={data?.bioProducts ?? 0}
        icon={Leaf}
        color="orange"
      />
    </div>
  );
}
