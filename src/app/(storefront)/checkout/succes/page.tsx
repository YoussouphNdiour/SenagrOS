import { and, eq, sql } from 'drizzle-orm';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import {
  type PaymentMethod,
  type PaymentStatus,
  paymentMethodLabels,
  paymentStatusLabels,
} from '@/lib/validators/order.validator';
import { formatXof } from '@/lib/validators/storefront.validator';
import { db } from '@/server/db';
import { farms, orders } from '@/server/db/schema';
import { requireBuyerPage } from '@/server/services/buyer-session';

interface Props {
  searchParams: Promise<{ ref?: string; paiement?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { ref = '', paiement } = await searchParams;
  const { profile } = await requireBuyerPage(`/checkout/succes?ref=${ref}`);
  const list = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalAmount: orders.totalAmount,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      estimatedDelivery: orders.estimatedDelivery,
      farmName: farms.name,
    })
    .from(orders)
    .innerJoin(farms, eq(orders.sellerFarmId, farms.id))
    .where(
      and(eq(orders.buyerProfileId, profile.id), sql`${orders.data}->>'checkout_ref' = ${ref}`),
    );

  const failed = paiement === 'echec';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      {failed ? (
        <XCircle className="mx-auto h-16 w-16 text-red-700" />
      ) : (
        <CheckCircle2 className="mx-auto h-16 w-16 text-brand" />
      )}
      <h1 className="mt-4 text-2xl font-bold text-ink">
        {failed ? 'Paiement non abouti' : 'Merci, votre commande est enregistrée !'}
      </h1>
      <p className="mt-2 text-muted">
        {failed
          ? 'Votre commande est en attente de paiement. Vous pouvez réessayer depuis le détail de la commande.'
          : 'Le producteur va confirmer votre commande. Vous serez notifié à chaque étape.'}
      </p>

      <ul className="mt-8 space-y-3 text-left">
        {list.map((o) => (
          <li key={o.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink" data-testid="order-number">
                {o.orderNumber}
              </p>
              <Badge variant={o.paymentStatus === 'paid' ? 'success' : 'warning'}>
                {paymentStatusLabels[(o.paymentStatus ?? 'pending') as PaymentStatus]}
              </Badge>
            </div>
            <p className="text-sm text-muted">
              {o.farmName} — {formatXof(o.totalAmount)} —{' '}
              {paymentMethodLabels[o.paymentMethod as PaymentMethod]}
            </p>
            {o.estimatedDelivery && (
              <p className="text-sm text-muted">
                Livraison estimée : {new Date(o.estimatedDelivery).toLocaleDateString('fr-FR')}
              </p>
            )}
            <Link
              href={`/mes-commandes/${o.id}`}
              className="mt-2 inline-block text-sm text-brand-dark hover:underline"
            >
              Suivre la commande →
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-6 text-muted">Commande introuvable.</p>}

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/mes-commandes"
          className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Mes commandes
        </Link>
        <Link
          href="/catalogue"
          className="rounded-md border border-line px-5 py-2.5 text-ink"
        >
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
