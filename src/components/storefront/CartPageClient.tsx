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
    return <div className="py-24 text-center text-gray-500">Chargement du panier…</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <ShoppingBasket className="mx-auto h-14 w-14 text-gray-300" />
        <p className="mt-4 text-lg font-semibold text-gray-800">Votre panier est vide</p>
        <Link
          href="/catalogue"
          className="mt-6 inline-block rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
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
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {q.groups.map((group) => (
          <section
            key={group.farmId}
            className="rounded-xl bg-white p-4 shadow-sm"
            data-testid="cart-group"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <p className="font-semibold text-gray-800">Vendu par {group.farmName}</p>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Livraison :</span>
                <select
                  aria-label={`Zone de livraison ${group.farmName}`}
                  value={group.zone?.id ?? ''}
                  onChange={(e) => cart.setZone(group.farmId, e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
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
            <ul className="divide-y divide-gray-100">
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
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link
                          href={`/catalogue/${line.id}`}
                          className="font-medium text-gray-800 hover:underline"
                        >
                          {line.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {formatXof(line.unitPrice)} /{unit}
                          {line.appliedTier !== 'base' && line.appliedTier !== 'particulier' && (
                            <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                              {buyerTypePriceLabels[line.appliedTier]}
                            </span>
                          )}
                        </p>
                        {line.quantity > line.stockAvailable && (
                          <p className="text-xs text-red-600">
                            Stock disponible : {formatQuantity(line.stockAvailable)} {unit}
                          </p>
                        )}
                        {line.quantity < line.minOrderQuantity && (
                          <p className="text-xs text-red-600">
                            Minimum : {formatQuantity(line.minOrderQuantity)} {unit}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-lg border border-gray-300">
                          <button
                            type="button"
                            aria-label="Diminuer"
                            onClick={() =>
                              cart.setQuantity(
                                line.id,
                                Math.max(line.quantity - step, line.minOrderQuantity),
                              )
                            }
                            className="p-2 hover:bg-gray-50"
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
                            className="p-2 hover:bg-gray-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="w-28 text-right font-semibold text-gray-800">
                          {formatXof(line.lineTotal)}
                        </p>
                        <button
                          type="button"
                          aria-label={`Retirer ${line.name}`}
                          onClick={() => cart.remove(line.id)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
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
              <p className="mt-2 rounded-lg bg-orange-50 p-2 text-sm text-orange-700">
                Commande minimum de {formatXof(group.minOrder)} pour la zone {group.zone?.name}.
              </p>
            )}
          </section>
        ))}
      </div>

      <aside className="h-fit rounded-xl bg-white p-5 shadow-sm lg:sticky lg:top-20">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Récapitulatif</h2>
        {q.buyerType && (
          <p className="mb-3 rounded-lg bg-green-50 p-2 text-xs text-green-800">
            Tarif appliqué : {buyerTypePriceLabels[q.buyerType]}
          </p>
        )}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Sous-total</dt>
            <dd data-testid="cart-subtotal">{formatXof(q.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Frais de livraison</dt>
            <dd>{q.allZonesChosen ? formatXof(q.deliveryFee) : 'Choisir une zone'}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd data-testid="cart-total">{formatXof(q.total)}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={checkout}
          disabled={q.hasIssues}
          className="mt-5 w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          Valider la commande
        </button>
        {!session?.user && (
          <p className="mt-3 text-center text-xs text-gray-500">
            Déjà client ?{' '}
            <Link href="/login?callbackUrl=/checkout" className="text-green-700 hover:underline">
              Se connecter
            </Link>
          </p>
        )}
        {session?.user && !isBuyer && (
          <p className="mt-3 text-center text-xs text-orange-600">
            Votre compte producteur ne peut pas commander. Créez un compte acheteur.
          </p>
        )}
      </aside>
    </div>
  );
}
