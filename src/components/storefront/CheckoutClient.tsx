'use client';

import { Banknote, Check, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCartQuote } from '@/hooks/useCartQuote';
import { trpc } from '@/lib/trpc';
import {
  deliveryInfoSchema,
  type PaymentMethod,
  paymentMethodLabels,
} from '@/lib/validators/order.validator';
import {
  formatQuantity,
  formatXof,
  type ListingUnit,
  listingUnitLabels,
  SENEGAL_REGIONS,
} from '@/lib/validators/storefront.validator';

const STEPS = ['Récapitulatif', 'Adresse', 'Livraison', 'Paiement', 'Confirmation'] as const;

const PAYMENT_OPTIONS: { value: PaymentMethod; icon: typeof Banknote; hint: string }[] = [
  { value: 'cod', icon: Banknote, hint: 'Réglez en espèces à la réception' },
  { value: 'wave', icon: Smartphone, hint: 'Paiement mobile sécurisé Wave' },
  { value: 'orange_money', icon: Smartphone, hint: 'Paiement mobile Orange Money' },
];

interface CheckoutClientProps {
  profile: {
    address: string;
    city: string | null;
    region: string | null;
    phone: string;
    paymentPreference: string | null;
  };
}

export function CheckoutClient({ profile }: CheckoutClientProps) {
  const router = useRouter();
  const q = useCartQuote();
  const { cart } = q;
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [address, setAddress] = useState({
    deliveryAddress: profile.address,
    deliveryCity: profile.city ?? '',
    deliveryRegion: profile.region ?? 'Dakar',
    deliveryPhone: profile.phone,
    deliveryNotes: '',
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (['cod', 'wave', 'orange_money'] as const).find((m) => m === profile.paymentPreference) ??
      'cod',
  );

  const createOrder = trpc.order.createOrder.useMutation();
  const initiateWave = trpc.payment.initiateWave.useMutation();
  const initiateOm = trpc.payment.initiateOrangeMoney.useMutation();
  const submitting = createOrder.isPending || initiateWave.isPending || initiateOm.isPending;

  if (q.isLoading) return <p className="py-24 text-center text-muted">Chargement…</p>;
  if (cart.items.length === 0 && !createOrder.isSuccess) {
    return (
      <div className="py-24 text-center">
        <p className="text-ink">Votre panier est vide.</p>
        <Link href="/catalogue" className="mt-4 inline-block text-brand-dark hover:underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const validateAddress = () => {
    const parsed = deliveryInfoSchema.safeParse(address);
    if (parsed.success) {
      setAddressErrors({});
      return true;
    }
    const errs: Record<string, string> = {};
    for (const issue of parsed.error.issues) errs[String(issue.path[0])] ??= issue.message;
    setAddressErrors(errs);
    return false;
  };

  const canContinue = [
    !q.hasInvalidQuantities,
    true,
    q.allZonesChosen && !q.groups.some((g) => g.belowMinimum),
    true,
    true,
  ][step];

  const next = () => {
    setError('');
    if (step === 1 && !validateAddress()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const confirm = async () => {
    setError('');
    try {
      const result = await createOrder.mutateAsync({
        items: cart.items,
        zoneByFarm: Object.fromEntries(q.groups.map((g) => [g.farmId, g.zone?.id ?? ''])),
        paymentMethod,
        ...address,
        deliveryNotes: address.deliveryNotes || undefined,
        deliveryCity: address.deliveryCity || undefined,
      });
      cart.clear();
      const orderIds = result.orders.map((o) => o.id);
      if (paymentMethod === 'cod') {
        router.push(`/checkout/succes?ref=${result.checkoutRef}`);
        return;
      }
      const payment =
        paymentMethod === 'wave'
          ? await initiateWave.mutateAsync({ orderIds })
          : await initiateOm.mutateAsync({ orderIds });
      window.location.href = payment.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la commande');
    }
  };

  const field = (
    key: keyof typeof address,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label htmlFor={key} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={key}
        value={address[key]}
        onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
        className="w-full rounded-md border border-line px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        {...props}
      />
      {addressErrors[key] && <p className="mt-1 text-sm text-red-700">{addressErrors[key]}</p>}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div>
        <ol className="mb-6 flex flex-wrap gap-2" aria-label="Étapes">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                i === step
                  ? 'bg-brand text-white'
                  : i < step
                    ? 'bg-brand-soft text-brand-dark'
                    : 'bg-surface text-muted'
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>} {label}
            </li>
          ))}
        </ol>

        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">{STEPS[step]}</h2>

          {step === 0 && (
            <div className="space-y-4">
              {q.groups.map((g) => (
                <div key={g.farmId}>
                  <p className="mb-2 text-sm font-semibold text-ink">{g.farmName}</p>
                  <ul className="divide-y divide-line text-sm">
                    {g.lines.map((l) => (
                      <li key={l.id} className="flex justify-between py-2">
                        <span>
                          {l.name} — {formatQuantity(l.quantity)}{' '}
                          {listingUnitLabels[(l.unit ?? 'kg') as ListingUnit]} ×{' '}
                          {formatXof(l.unitPrice)}
                        </span>
                        <span className="font-medium">{formatXof(l.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {q.hasInvalidQuantities && (
                <p className="text-sm text-red-700">
                  Certaines quantités ne sont pas valides.{' '}
                  <Link href="/panier" className="underline">
                    Modifier le panier
                  </Link>
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                {field('deliveryAddress', 'Adresse de livraison')}
              </div>
              {field('deliveryCity', 'Ville')}
              <div>
                <label
                  htmlFor="deliveryRegion"
                  className="mb-1 block text-sm font-medium text-ink"
                >
                  Région
                </label>
                <select
                  id="deliveryRegion"
                  value={address.deliveryRegion}
                  onChange={(e) => setAddress((a) => ({ ...a, deliveryRegion: e.target.value }))}
                  className="w-full rounded-md border border-line px-4 py-2.5 text-sm"
                >
                  {SENEGAL_REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              {field('deliveryPhone', 'Téléphone', { type: 'tel' })}
              {field('deliveryNotes', 'Instructions (facultatif)', {
                placeholder: 'Ex : appeler avant de livrer',
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {q.groups.map((g) => (
                <div key={g.farmId}>
                  <label
                    htmlFor={`zone-${g.farmId}`}
                    className="mb-1 block text-sm font-medium text-ink"
                  >
                    Zone de livraison — {g.farmName}
                  </label>
                  <select
                    id={`zone-${g.farmId}`}
                    data-testid="zone-select"
                    value={g.zone?.id ?? ''}
                    onChange={(e) => cart.setZone(g.farmId, e.target.value)}
                    className="w-full rounded-md border border-line px-4 py-2.5 text-sm"
                  >
                    <option value="" disabled>
                      Choisir une zone
                    </option>
                    {g.zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.region}) — {formatXof(z.deliveryFee)} — {z.estimatedDays} j
                      </option>
                    ))}
                  </select>
                  {g.zones.length === 0 && (
                    <p className="mt-1 text-sm text-orange-700">
                      Ce producteur n'a pas encore défini de zone de livraison.
                    </p>
                  )}
                  {g.zone && (
                    <p className="mt-1 text-sm text-muted">
                      Frais : <strong>{formatXof(g.zone.deliveryFee)}</strong> — livraison estimée
                      sous {g.zone.estimatedDays} jour(s)
                    </p>
                  )}
                  {g.belowMinimum && (
                    <p className="mt-1 text-sm text-red-700">
                      Commande minimum {formatXof(g.minOrder)} pour cette zone.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <fieldset className="space-y-3">
              <legend className="sr-only">Moyen de paiement</legend>
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border-2 p-4 ${
                    paymentMethod === opt.value ? 'border-brand bg-brand-soft' : 'border-line'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="accent-brand"
                  />
                  <opt.icon className="h-5 w-5 text-muted" />
                  <span>
                    <span className="block font-medium text-ink">
                      {paymentMethodLabels[opt.value]}
                    </span>
                    <span className="text-xs text-muted">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {step === 4 && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Livraison à</dt>
                <dd className="text-right">
                  {address.deliveryAddress}
                  {address.deliveryCity && `, ${address.deliveryCity}`} ({address.deliveryRegion})
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Téléphone</dt>
                <dd>{address.deliveryPhone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Paiement</dt>
                <dd>{paymentMethodLabels[paymentMethod]}</dd>
              </div>
              {q.groups.length > 1 && (
                <p className="rounded-md bg-blue-50 p-2 text-blue-800">
                  Votre panier contient des produits de {q.groups.length} producteurs :{' '}
                  {q.groups.length} commandes seront créées.
                </p>
              )}
            </dl>
          )}

          {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || submitting}
              className="rounded-md border border-line px-4 py-2 text-sm text-ink disabled:opacity-40"
            >
              Retour
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canContinue}
                className="rounded-md bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                Continuer
              </button>
            ) : (
              <button
                type="button"
                onClick={confirm}
                disabled={submitting}
                className="rounded-md bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {submitting ? 'Envoi…' : 'Confirmer la commande'}
              </button>
            )}
          </div>
        </section>
      </div>

      <aside className="h-fit overflow-hidden rounded-lg border border-line bg-white lg:sticky lg:top-44">
        <h2 className="border-b border-line px-6 py-4 text-xl font-semibold text-ink">
          Détails de la commande
        </h2>
        <ul className="divide-y divide-line">
          {q.groups.flatMap((g) =>
            g.lines.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-6 py-3 text-sm">
                {/* biome-ignore lint/performance/noImgElement: static product photo */}
                <img
                  src={l.photos?.[0]?.url ?? '/storefront/products/placeholder.svg'}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{l.name}</p>
                  <p className="text-xs text-muted">
                    {formatQuantity(l.quantity)}{' '}
                    {listingUnitLabels[(l.unit ?? 'kg') as ListingUnit]} × {formatXof(l.unitPrice)}
                  </p>
                </div>
                <p className="font-semibold text-ink">{formatXof(l.lineTotal)}</p>
              </li>
            )),
          )}
        </ul>
        <dl className="space-y-2 border-t border-line px-6 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Sous-total articles</dt>
            <dd className="text-ink">{formatXof(q.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Livraison</dt>
            <dd className="text-ink">{q.allZonesChosen ? formatXof(q.deliveryFee) : '—'}</dd>
          </div>
        </dl>
        <div className="flex justify-between border-t border-line px-6 py-4 font-semibold text-ink">
          <span>Total</span>
          <span data-testid="checkout-total">{formatXof(q.total)}</span>
        </div>
      </aside>
    </div>
  );
}
