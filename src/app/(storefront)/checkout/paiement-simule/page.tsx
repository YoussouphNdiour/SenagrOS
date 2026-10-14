import { notFound } from 'next/navigation';
import { SimulatedPaymentClient } from '@/components/storefront/SimulatedPaymentClient';
import { isSimulationMode } from '@/server/services/payment.service';
import { requireBuyerPage } from '@/server/services/buyer-session';

interface Props {
  searchParams: Promise<{ provider?: string; ref?: string }>;
}

/** Sandbox stand-in for the Wave / Orange Money hosted payment page (dev only). */
export default async function SimulatedPaymentPage({ searchParams }: Props) {
  const { provider, ref } = await searchParams;
  const p = provider === 'orange_money' ? 'orange_money' : 'wave';
  if (!ref || !isSimulationMode(p)) notFound();
  await requireBuyerPage(`/checkout/paiement-simule?provider=${p}&ref=${ref}`);
  return <SimulatedPaymentClient provider={p} checkoutRef={ref} />;
}
