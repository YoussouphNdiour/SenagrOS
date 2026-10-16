'use client';

import { Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCartQuote } from '@/hooks/useCartQuote';
import {
  buyerTypePriceLabels,
  formatQuantity,
  formatXof,
  type ListingUnit,
  listingUnitLabels,
} from '@/lib/validators/storefront.validator';
import { listingPhoto } from './photos';

export function CartPageClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const q = useCartQuote();
  const { cart } = q;

  // Drop products that are no longer published
  useEffect(() => {
    for (const id of q.unavailable) cart.remove(id);
  }, [q.unavailable, cart]);

  if (q.isLoading) {
    return <div className="py-24 text-center text-muted">Chargement du panier…</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <ShoppingBasket className="mx-auto h-14 w-14 text-gray-300" />
        <p className="mt-4 text-lg font-semibold text-ink">Votre panier est vide</p>
        <Link
          href="/catalogue"
          className="mt-6 inline-block rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Découvrir les produits
        </Link>
      </div>
    );
  }

  const isBuyer = session?.user?.role === 'buyer';
  const checkout = () => {
    if (isBuyer) router.push('/checkout');
    else router.push('/inscription-acheteur?callbackUrl=/checkout');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        {q.groups.map((group) => (
          <section
            key={group.farmId}
            className="rounded-lg border border-line bg-white p-4"
            data-testid="cart-group"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <p className="font-semibold text-ink">Vendu par {group.farmName}</p>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted">Livraison :</span>
                <select
                  aria-label={`Zone de livraison ${group.farmName}`}
                  value={group.zone?.id ?? ''}
                  onChange={(e) => cart.setZone(group.farmId, e.target.value)}
                  className="rounded-md border border-line px-2 py-1.5 text-sm"
                >
                  <option value="" disabled>
                    Choisir une zone
                  </option>
                  {group.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {formatXof(z.deliveryFee)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ul className="divide-y divide-line">
              {group.lines.map((line) => {
                const unit = listingUnitLabels[(line.unit ?? 'kg') as ListingUnit] ?? line.unit;
                const photo = listingPhoto(line.photos);
                const step = line.minOrderQuantity >= 1 ? 1 : line.minOrderQuantity;
                return (
                  <li key={line.id} className="flex gap-4 py-4" data-testid="cart-line">
                    {/* biome-ignore lint/performance/noImgElement: local SVG placeholders */}
                    <img
                      src={photo.url}
                      alt={line.name}
                      className="h-20 w-20 shrink-0 rounded-md object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link
                          href={`/catalogue/${line.id}`}
                          className="font-medium text-ink hover:underline"
                        >
                          {line.name}
                        </Link>
                        <p className="text-sm text-muted">
                          {formatXof(line.unitPrice)} /{unit}
                          {line.appliedTier !== 'base' && line.appliedTier !== 'particulier' && (
                            <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-xs text-brand-dark">
                              {buyerTypePriceLabels[line.appliedTier]}
                            </span>
                          )}
                        </p>
                        {line.quantity > line.stockAvailable && (
                          <p className="text-xs text-red-700">
                            Stock disponible : {formatQuantity(line.stockAvailable)} {unit}
                          </p>
                        )}
                        {line.quantity < line.minOrderQuantity && (
                          <p className="text-xs text-red-700">
                            Minimum : {formatQuantity(line.minOrderQuantity)} {unit}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-md border border-line">
                          <button
                            type="button"
                            aria-label="Diminuer"
                            onClick={() =>
                              cart.setQuantity(
                                line.id,
                                Math.max(line.quantity - step, line.minOrderQuantity),
                              )
                            }
                            className="p-2 hover:bg-surface"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-14 text-center text-sm" data-testid="cart-line-qty">
                            {formatQuantity(line.quantity)}
                          </span>
                          <button
                            type="button"
                            aria-label="Augmenter"
                            onClick={() =>
                              cart.setQuantity(
                                line.id,
                                Math.min(line.quantity + step, line.stockAvailable),
                              )
                            }
                            className="p-2 hover:bg-surface"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="w-28 text-right font-semibold text-ink">
                          {formatXof(line.lineTotal)}
                        </p>
                        <button
                          type="button"
                          aria-label={`Retirer ${line.name}`}
                          onClick={() => cart.remove(line.id)}
                          className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {group.belowMinimum && (
              <p className="mt-2 rounded-md bg-orange-50 p-2 text-sm text-orange-700">
                Commande minimum de {formatXof(group.minOrder)} pour la zone {group.zone?.name}.
              </p>
            )}
          </section>
        ))}
      </div>

      <aside className="h-fit rounded-lg border border-line bg-white p-6 lg:sticky lg:top-44">
        <h2 className="mb-4 text-xl font-semibold text-ink">Récapitulatif</h2>
        {q.buyerType && (
          <p className="mb-4 rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            Tarif appliqué : {buyerTypePriceLabels[q.buyerType]}
          </p>
        )}
        <dl className="divide-y divide-line rounded-md border border-line text-sm">
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted">Sous-total articles</dt>
            <dd className="text-ink" data-testid="cart-subtotal">
              {formatXof(q.subtotal)}
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-muted">Frais de livraison</dt>
            <dd className="text-ink">
              {q.allZonesChosen ? formatXof(q.deliveryFee) : 'Choisir une zone'}
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3 font-semibold text-ink">
            <dt>Total</dt>
            <dd data-testid="cart-total">{formatXof(q.total)}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={checkout}
          disabled={q.hasIssues}
          className="mt-5 flex w-full items-center justify-between rounded-md bg-brand px-5 py-3.5 text-lg font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          <span>Valider la commande</span>
          <span aria-hidden>{formatXof(q.total)}</span>
        </button>
        {!session?.user && (
          <p className="mt-3 text-sm text-muted">
            Déjà client ?{' '}
            <Link
              href="/login?callbackUrl=/checkout"
              className="font-medium text-brand hover:text-brand-dark"
            >
              Se connecter
            </Link>
          </p>
        )}
        {session?.user && !isBuyer && (
          <p className="mt-3 text-sm text-orange-700">
            Votre compte producteur ne peut pas commander. Créez un compte acheteur.
          </p>
        )}
        <Link
          href="/catalogue"
          className="mt-5 block text-center text-sm font-medium text-brand hover:text-brand-dark"
        >
          ← Continuer mes achats
        </Link>
      </aside>
    </div>
  );
}
