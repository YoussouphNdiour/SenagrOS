'use client';

import { Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { formatXof } from '@/lib/validators/storefront.validator';

interface Props {
  provider: 'wave' | 'orange_money';
  checkoutRef: string;
}

export function SimulatedPaymentClient({ provider, checkoutRef }: Props) {
  const router = useRouter();
  const checkout = trpc.order.getCheckout.useQuery({ checkoutRef });
  const simulate = trpc.payment.simulate.useMutation({
    onSuccess: (_, vars) =>
      router.push(
        `/checkout/succes?ref=${checkoutRef}${vars.outcome === 'failed' ? '&paiement=echec' : ''}`,
      ),
  });
  const amount = (checkout.data ?? [])
    .filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'paid')
    .reduce((s, o) => s + Number(o.totalAmount), 0);
  const brand =
    provider === 'wave'
      ? { name: 'Wave', className: 'bg-sky-500' }
      : { name: 'Orange Money', className: 'bg-orange-500' };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className={`${brand.className} p-6 text-center text-white`}>
          <Smartphone className="mx-auto h-10 w-10" />
          <p className="mt-2 text-lg font-bold">{brand.name}</p>
          <p className="text-xs opacity-90">Mode sandbox — paiement simulé</p>
        </div>
        <div className="space-y-4 p-6 text-center">
          <p className="text-sm text-gray-500">Montant à payer</p>
          <p className="text-3xl font-extrabold text-gray-900">{formatXof(amount)}</p>
          <button
            type="button"
            disabled={simulate.isPending || amount === 0}
            onClick={() => simulate.mutate({ checkoutRef, outcome: 'paid' })}
            className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Simuler un paiement réussi
          </button>
          <button
            type="button"
            disabled={simulate.isPending}
            onClick={() => simulate.mutate({ checkoutRef, outcome: 'failed' })}
            className="w-full rounded-lg border border-gray-300 py-3 text-gray-700 hover:bg-gray-50"
          >
            Simuler un échec
          </button>
          <p className="text-xs text-gray-400">
            Configurez {provider === 'wave' ? 'WAVE_API_KEY' : 'ORANGE_MONEY_*'} pour utiliser l'API
            réelle.
          </p>
        </div>
      </div>
    </div>
  );
}
