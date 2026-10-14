'use client';

import { Package, ShoppingBag, Star, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { trpc } from '@/lib/trpc';
import {
  type OrderStatus,
  orderStatusLabels,
  orderStatusVariants,
} from '@/lib/validators/order.validator';
import { formatXof } from '@/lib/validators/storefront.validator';

export function StorefrontKpis() {
  const { data } = trpc.sellerOrders.stats.useQuery();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="CA boutique (livré)"
        value={formatXof(data?.revenue ?? 0)}
        icon={Wallet}
        color="green"
      />
      <KpiCard
        title="Commandes en cours"
        value={data?.inProgress ?? 0}
        icon={ShoppingBag}
        color="blue"
      />
      <KpiCard
        title="Produits publiés"
        value={data ? `${data.publishedListings} / ${data.totalListings}` : 0}
        icon={Package}
        color="orange"
      />
      <KpiCard
        title={`Note moyenne (${data?.reviewCount ?? 0} avis)`}
        value={data?.averageRating ? `${data.averageRating} / 5` : '—'}
        icon={Star}
        color="purple"
      />
    </div>
  );
}

export function StorefrontOverview() {
  const stats = trpc.sellerOrders.stats.useQuery();
  const recent = trpc.sellerOrders.getReceivedOrders.useQuery({ page: 1, limit: 5 });

  return (
    <div className="space-y-6">
      <StorefrontKpis />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Dernières commandes"
            action={
              <Link
                href="/dashboard/storefront/commandes"
                className="text-sm text-green-700 hover:underline"
              >
                Tout voir
              </Link>
            }
          />
          {recent.data?.items.length ? (
            <ul className="divide-y divide-gray-100 text-sm">
              {recent.data.items.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">{o.orderNumber}</p>
                    <p className="text-gray-500">{o.buyerCompany ?? o.buyerName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={orderStatusVariants[o.status as OrderStatus]}>
                      {orderStatusLabels[o.status as OrderStatus]}
                    </Badge>
                    <p className="mt-1 font-semibold">{formatXof(o.totalAmount)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">Aucune commande pour le moment</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Performance" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Commandes totales</dt>
              <dd className="font-semibold">{stats.data?.totalOrders ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">En attente de confirmation</dt>
              <dd className="font-semibold">{stats.data?.pending ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Taux de complétion</dt>
              <dd className="font-semibold">{stats.data?.completionRate ?? 0} %</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
