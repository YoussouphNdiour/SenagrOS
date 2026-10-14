'use client';

import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { trpc } from '@/lib/trpc';
import {
  type OrderStatus,
  orderStatusEnum,
  orderStatusLabels,
  orderStatusVariants,
  type PaymentMethod,
  paymentMethodLabels,
} from '@/lib/validators/order.validator';
import { formatXof } from '@/lib/validators/storefront.validator';

export function MyOrdersClient() {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.order.getMyOrders.useQuery({ status, page, limit: 10 });
  const reorder = trpc.order.reorder.useMutation({
    onSuccess: (res) => {
      const order = res.orders[0];
      if (order.paymentMethod === 'cod') router.push(`/checkout/succes?ref=${res.checkoutRef}`);
      else router.push(`/mes-commandes/${order.id}`);
    },
  });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[undefined, ...orderStatusEnum.options.filter((s) => s !== 'refunded')].map((s) => (
          <button
            key={s ?? 'all'}
            type="button"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-sm ${
              status === s
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 ring-1 ring-gray-200'
            }`}
          >
            {s ? orderStatusLabels[s] : 'Toutes'}
          </button>
        ))}
      </div>

      {reorder.error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {reorder.error.message}
        </p>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-gray-500">Chargement…</p>
      ) : !data?.items.length ? (
        <div className="rounded-xl bg-white p-12 text-center">
          <p className="text-gray-600">Aucune commande.</p>
          <Link href="/catalogue" className="mt-3 inline-block text-green-700 hover:underline">
            Découvrir le catalogue
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.items.map((o) => (
            <li key={o.id} className="rounded-xl bg-white p-4 shadow-sm" data-testid="my-order">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/mes-commandes/${o.id}`}
                    className="font-semibold text-gray-800 hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {o.farmName} · {o.itemCount} article{o.itemCount > 1 ? 's' : ''} ·{' '}
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {paymentMethodLabels[o.paymentMethod as PaymentMethod]}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={orderStatusVariants[o.status as OrderStatus]}>
                    {orderStatusLabels[o.status as OrderStatus]}
                  </Badge>
                  <p className="mt-1 font-bold text-gray-800">{formatXof(o.totalAmount)}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-3 border-t border-gray-100 pt-3">
                <Link
                  href={`/mes-commandes/${o.id}`}
                  className="text-sm font-medium text-green-700 hover:underline"
                >
                  Détails & suivi
                </Link>
                <button
                  type="button"
                  disabled={reorder.isPending}
                  onClick={() => reorder.mutate({ id: o.id })}
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-green-700 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" /> Re-commander
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-lg text-sm ${n === page ? 'bg-green-600 text-white' : 'bg-white'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
