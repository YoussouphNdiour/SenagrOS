'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import {
  orderStatusLabels,
  deliveryMethodLabels,
  type OrderStatus,
  type DeliveryMethod,
} from '@/lib/validators/marketplace.validator';

interface OrderListClientProps {
  mode: 'received' | 'placed';
}

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'default',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export function OrderListClient({ mode }: OrderListClientProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const queryInput = {
    status: statusFilter || undefined,
    page,
    limit: 25,
  };

  const { data: receivedData, isLoading: receivedLoading } =
    trpc.marketplace.listReceivedOrders.useQuery(queryInput, { enabled: mode === 'received' });
  const { data: placedData, isLoading: placedLoading } =
    trpc.marketplace.listPlacedOrders.useQuery(queryInput, { enabled: mode === 'placed' });

  const data = mode === 'received' ? receivedData : placedData;
  const isLoading = mode === 'received' ? receivedLoading : placedLoading;

  const updateStatus = trpc.marketplace.updateOrderStatus.useMutation({
    onSuccess: () => {
      utils.marketplace.listReceivedOrders.invalidate();
      utils.marketplace.sellerKpis.invalidate();
    },
  });

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(orderStatusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{data?.total ?? 0} commande{(data?.total ?? 0) > 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          </div>
        ) : !data?.items.length ? (
          <div className="py-16 text-center text-gray-500">
            Aucune commande.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">{mode === 'received' ? 'Acheteur' : 'Vendeur'}</th>
                <th className="px-4 py-3">Quantité</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Livraison</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
                {mode === 'received' && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => {
                const counterparty = mode === 'received'
                  ? (order as { buyerName?: string | null }).buyerName ?? (order as { buyerFarmName?: string | null }).buyerFarmName
                  : (order as { sellerFarmName?: string | null }).sellerFarmName;

                return (
                  <tr key={order.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {order.productName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {String(counterparty ?? '—')}
                    </td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat('fr-SN').format(Number(order.quantity))} kg
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {new Intl.NumberFormat('fr-SN').format(Number(order.totalAmount))} FCFA
                    </td>
                    <td className="px-4 py-3">
                      {deliveryMethodLabels[order.deliveryMethod as DeliveryMethod] ?? order.deliveryMethod ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColors[order.status] ?? 'default'}>
                        {orderStatusLabels[order.status as OrderStatus] ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    {mode === 'received' && (
                      <td className="px-4 py-3 text-right">
                        {order.status === 'pending' && (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => updateStatus.mutate({ orderId: order.id, status: 'confirmed' })}
                              className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ orderId: order.id, status: 'cancelled' })}
                              className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus.mutate({ orderId: order.id, status: 'shipped' })}
                            className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                          >
                            Expédier
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateStatus.mutate({ orderId: order.id, status: 'delivered' })}
                            className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                          >
                            Livré
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 25 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="flex items-center px-3 text-sm text-gray-600">
            Page {page} / {Math.ceil(data.total / 25)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 25 >= data.total}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
