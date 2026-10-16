'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { trpc } from '@/lib/trpc';
import {
  type OrderStatus,
  orderStatusLabels,
  orderStatusVariants,
  type PaymentMethod,
  type PaymentStatus,
  paymentMethodLabels,
  paymentStatusLabels,
} from '@/lib/validators/order.validator';
import {
  formatQuantity,
  formatXof,
  type ListingUnit,
  listingUnitLabels,
} from '@/lib/validators/storefront.validator';
import { OrderTimeline } from './OrderTimeline';
import { PLACEHOLDER_PHOTO } from './photos';
import { StarRating } from './StarRating';

export function OrderDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: order, isLoading, error } = trpc.order.getOrder.useQuery({ id });
  const cancel = trpc.order.cancelOrder.useMutation({
    onSuccess: () => utils.order.getOrder.invalidate({ id }),
  });
  const reorder = trpc.order.reorder.useMutation({
    onSuccess: (res) => router.push(`/mes-commandes/${res.orders[0].id}`),
  });
  const payWave = trpc.payment.initiateWave.useMutation({
    onSuccess: (r) => {
      window.location.href = r.url;
    },
  });
  const payOm = trpc.payment.initiateOrangeMoney.useMutation({
    onSuccess: (r) => {
      window.location.href = r.url;
    },
  });

  if (isLoading) return <p className="py-24 text-center text-muted">Chargement…</p>;
  if (error || !order) {
    return <p className="py-24 text-center text-muted">Commande introuvable.</p>;
  }

  const unpaidMobile =
    order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid' && order.status !== 'cancelled';
  const actionError = cancel.error ?? reorder.error ?? payWave.error ?? payOm.error;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-ink">{order.orderNumber}</h1>
              <p className="text-sm text-muted">
                {order.farmName} · passée le{' '}
                {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR') : ''}
              </p>
            </div>
            <Badge variant={orderStatusVariants[order.status as OrderStatus]}>
              <span data-testid="order-status">
                {orderStatusLabels[order.status as OrderStatus]}
              </span>
            </Badge>
          </div>

          {actionError && (
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {actionError.message}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {order.canCancel && (
              <button
                type="button"
                disabled={cancel.isPending}
                onClick={() => {
                  if (window.confirm('Annuler cette commande ?')) cancel.mutate({ id });
                }}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Annuler la commande
              </button>
            )}
            {unpaidMobile && (
              <button
                type="button"
                disabled={payWave.isPending || payOm.isPending}
                onClick={() =>
                  order.paymentMethod === 'wave'
                    ? payWave.mutate({ orderIds: [order.id] })
                    : payOm.mutate({ orderIds: [order.id] })
                }
                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Payer avec {paymentMethodLabels[order.paymentMethod as PaymentMethod]}
              </button>
            )}
            <button
              type="button"
              disabled={reorder.isPending}
              onClick={() => reorder.mutate({ id })}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Re-commander
            </button>
          </div>
          {order.status === 'pending' && !order.canCancel && (
            <p className="mt-2 text-xs text-muted">
              L'annulation n'est possible que dans les {order.cancelWindowMinutes} minutes suivant
              la commande.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="mb-3 font-semibold text-ink">Articles</h2>
          <ul className="divide-y divide-line">
            {order.items.map((item) => {
              const review = order.reviews.find((r) => r.listingId === item.listingId);
              const unit = listingUnitLabels[item.unit as ListingUnit] ?? item.unit;
              return (
                <li key={item.id} className="py-4">
                  <div className="flex gap-4">
                    {/* biome-ignore lint/performance/noImgElement: local SVG placeholders */}
                    <img
                      src={item.photo ?? PLACEHOLDER_PHOTO}
                      alt=""
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <Link
                        href={`/catalogue/${item.listingId}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-muted">
                        {formatQuantity(item.quantity)} {unit} × {formatXof(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-semibold text-ink">{formatXof(item.totalPrice)}</p>
                  </div>
                  {order.status === 'delivered' &&
                    (review ? (
                      <div className="mt-2 rounded-md bg-surface p-3 text-sm">
                        <StarRating value={review.rating} size="sm" />{' '}
                        {review.comment && <span className="text-muted">{review.comment}</span>}
                      </div>
                    ) : (
                      <ReviewForm
                        orderId={order.id}
                        listingId={item.listingId}
                        onDone={() => utils.order.getOrder.invalidate({ id })}
                      />
                    ))}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="mb-4 font-semibold text-ink">Suivi</h2>
          <OrderTimeline
            status={order.status}
            createdAt={order.createdAt}
            confirmedAt={order.confirmedAt}
            preparingAt={order.data?.preparing_at}
            shippedAt={order.shippedAt}
            deliveredAt={order.deliveredAt}
            cancelledAt={order.cancelledAt}
          />
          {order.estimatedDelivery &&
            order.status !== 'delivered' &&
            order.status !== 'cancelled' && (
              <p className="mt-4 text-sm text-muted">
                Livraison estimée : {new Date(order.estimatedDelivery).toLocaleDateString('fr-FR')}
              </p>
            )}
        </section>

        <section className="rounded-lg border border-line bg-white p-5 text-sm">
          <h2 className="mb-3 font-semibold text-ink">Paiement & livraison</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted">Sous-total</dt>
              <dd>{formatXof(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Livraison ({order.zoneName})</dt>
              <dd>{formatXof(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-bold">
              <dt>Total</dt>
              <dd>{formatXof(order.totalAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Mode</dt>
              <dd>{paymentMethodLabels[order.paymentMethod as PaymentMethod]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Statut</dt>
              <dd>{paymentStatusLabels[(order.paymentStatus ?? 'pending') as PaymentStatus]}</dd>
            </div>
          </dl>
          <p className="mt-4 text-ink">
            {order.deliveryAddress}
            {order.deliveryCity && `, ${order.deliveryCity}`}
            <br />
            {order.deliveryRegion} · {order.deliveryPhone}
          </p>
        </section>
      </aside>
    </div>
  );
}

function ReviewForm({
  orderId,
  listingId,
  onDone,
}: {
  orderId: string;
  listingId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const create = trpc.review.create.useMutation({ onSuccess: onDone });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-sm font-medium text-brand-dark hover:underline"
      >
        Laisser un avis
      </button>
    );
  }
  return (
    <form
      className="mt-3 space-y-2 rounded-md bg-surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (rating) create.mutate({ orderId, listingId, rating, comment: comment || undefined });
      }}
    >
      <fieldset className="flex gap-1">
        <legend className="sr-only">Note</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={`rating-${listingId}`}
              value={n}
              checked={rating === n}
              onChange={() => setRating(n)}
              aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
              className="sr-only"
            />
            <Star
              className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
            />
          </label>
        ))}
      </fieldset>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Votre avis sur ce produit (facultatif)"
        aria-label="Commentaire"
        rows={2}
        className="w-full rounded-md border border-line p-2 text-sm"
      />
      {create.error && <p className="text-sm text-red-700">{create.error.message}</p>}
      <button
        type="submit"
        disabled={!rating || create.isPending}
        className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        Publier mon avis
      </button>
    </form>
  );
}
