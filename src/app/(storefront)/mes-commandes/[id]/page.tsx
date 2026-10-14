import { notFound } from 'next/navigation';
import { OrderDetailClient } from '@/components/storefront/OrderDetailClient';
import { requireBuyerPage } from '@/server/services/buyer-session';

interface Props {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MyOrderDetailPage({ params }: Props) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  await requireBuyerPage(`/mes-commandes/${id}`);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <OrderDetailClient id={id} />
    </div>
  );
}
