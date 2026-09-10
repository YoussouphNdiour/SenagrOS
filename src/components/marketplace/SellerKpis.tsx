'use client';

import { Package, Eye, ShoppingCart, Wallet } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { trpc } from '@/lib/trpc';

export function SellerKpis() {
  const { data } = trpc.marketplace.sellerKpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Mes produits"
        value={data?.totalProducts ?? 0}
        icon={Package}
        color="green"
      />
      <KpiCard
        title="Publiés"
        value={data?.publishedProducts ?? 0}
        icon={Eye}
        color="green"
      />
      <KpiCard
        title="Commandes reçues"
        value={data?.totalOrders ?? 0}
        icon={ShoppingCart}
        color="orange"
      />
      <KpiCard
        title="CA Marketplace"
        value={`${new Intl.NumberFormat('fr-SN').format(data?.totalRevenue ?? 0)} FCFA`}
        icon={Wallet}
        color="blue"
      />
    </div>
  );
}
