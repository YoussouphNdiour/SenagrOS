'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { trpc } from '@/lib/trpc';
import {
  nextSellerAction,
  type OrderStatus,
  orderStatusEnum,
  orderStatusLabels,
  orderStatusVariants,
  type PaymentMethod,
  type PaymentStatus,
  paymentMethodLabels,
  paymentStatusLabels,
  type SellerAction,
  sellerActionLabels,
} from '@/lib/validators/order.validator';
import {
  type BuyerType,
  buyerTypeLabels,
  formatQuantity,
  formatXof,
} from '@/lib/validators/storefront.validator';

export function SellerOrdersClient() {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = trpc.sellerOrders.getReceivedOrders.useQuery({
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  });

  const refresh = () => {
    utils.sellerOrders.getReceivedOrders.invalidate();
    utils.sellerOrders.stats.invalidate();
  };
  const mutations: Record<
    SellerAction,
    ReturnType<typeof trpc.sellerOrders.confirmOrder.useMutation>
  > = {
    confirm: trpc.sellerOrders.confirmOrder.useMutation({ onSuccess: refresh }),
    prepare: trpc.sellerOrders.prepareOrder.useMutation({ onSuccess: refresh }),
    ship: trpc.sellerOrders.shipOrder.useMutation({ onSuccess: refresh }),
    deliver: trpc.sellerOrders.deliverOrder.useMutation({ onSuccess: refresh }),
  };
  const markPaid = trpc.sellerOrders.markPaid.useMutation({ onSuccess: refresh });
  const pending = Object.values(mutations).some((m) => m.isPending) || markPaid.isPending;
  const error = Object.values(mutations).find((m) => m.error)?.error ?? markPaid.error;

  type Row = NonNullable<typeof data>['items'][number];

  const runAction = (row: Row, action: SellerAction) => {
    let codPaid: boolean | undefined;
    if (action === 'deliver' && row.paymentMethod === 'cod') {
      codPaid = window.confirm(
        `Paiement de ${formatXof(row.totalAmount)} encaissé à la livraison ?\n(OK = payé, Annuler = livrer sans encaisser)`,
      );
    }
    mutations[action].mutate({ id: row.id, codPaid });
  };

  const actionCell = (row: Row) => {
    const action = nextSellerAction(row.status);
    return (
      <div className="flex flex-wrap gap-2">
        {action && (
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              runAction(row, action);
            }}
            data-testid={`action-${action}`}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {sellerActionLabels[action]}
          </button>
        )}
        {row.paymentMethod === 'cod' &&
          row.paymentStatus !== 'paid' &&
          row.status === 'delivered' && (
            <button
              type="button"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation();
                markPaid.mutate({ id: row.id });
              }}
              className="rounded-lg border border-green-600 px-3 py-1 text-xs font-semibold text-green-700"
            >
              Paiement reçu
            </button>
          )}
      </div>
    );
  };

  const items = (data?.items ?? []) as Row[];
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Statut</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | '');
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {orderStatusEnum.options.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Du</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">Au</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error.message}</p>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">Chargement…</p>
      ) : (
        <DataTable<Row>
          data={items}
          emptyMessage="Aucune commande reçue"
          onRowClick={(row) => setExpanded((cur) => (cur === row.id ? null : row.id))}
          columns={[
            {
              key: 'orderNumber',
              header: 'N°',
              render: (r) => <span className="font-medium">{r.orderNumber}</span>,
            },
            {
              key: 'buyer',
              header: 'Client',
              render: (r) => (
                <div>
                  <p>{r.buyerCompany ?? r.buyerName}</p>
                  <p className="text-xs text-gray-500">
                    {buyerTypeLabels[r.buyerType as BuyerType]}
                  </p>
                </div>
              ),
            },
            {
              key: 'createdAt',
              header: 'Date',
              render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''),
            },
            { key: 'totalAmount', header: 'Total', render: (r) => formatXof(r.totalAmount) },
            {
              key: 'payment',
              header: 'Paiement',
              render: (r) => (
                <div className="text-xs">
                  <p>{paymentMethodLabels[r.paymentMethod as PaymentMethod]}</p>
                  <p className={r.paymentStatus === 'paid' ? 'text-green-700' : 'text-gray-500'}>
                    {paymentStatusLabels[(r.paymentStatus ?? 'pending') as PaymentStatus]}
                  </p>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Statut',
              render: (r) => (
                <span data-testid="seller-order-status">
                  <Badge variant={orderStatusVariants[r.status as OrderStatus]}>
                    {orderStatusLabels[r.status as OrderStatus]}
                  </Badge>
                </span>
              ),
            },
            { key: 'actions', header: 'Actions', render: actionCell },
          ]}
          mobileRender={(r) => (
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex justify-between">
                <p className="font-medium">{r.orderNumber}</p>
                <Badge variant={orderStatusVariants[r.status as OrderStatus]}>
                  {orderStatusLabels[r.status as OrderStatus]}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {r.buyerCompany ?? r.buyerName} · {formatXof(r.totalAmount)}
              </p>
              <div className="mt-2">{actionCell(r)}</div>
            </div>
          )}
        />
      )}

      {expanded &&
        items
          .filter((o) => o.id === expanded)
          .map((o) => (
            <div key={o.id} className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
              <p className="mb-2 font-semibold text-gray-800">Détail {o.orderNumber}</p>
              <ul className="mb-3 space-y-1">
                {o.lines.map((l) => (
                  <li key={l.id} className="flex justify-between">
                    <span>
                      {l.productName} — {formatQuantity(l.quantity)} {l.unit} ×{' '}
                      {formatXof(l.unitPrice)}
                    </span>
                    <span>{formatXof(l.totalPrice)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-600">
                Livraison : {o.deliveryAddress}
                {o.deliveryCity && `, ${o.deliveryCity}`} ({o.deliveryRegion}) — {o.deliveryPhone}
              </p>
              {o.deliveryNotes && <p className="text-gray-600">Instructions : {o.deliveryNotes}</p>}
            </div>
          ))}

      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-lg text-sm ${n === page ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
