import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { MyOrdersClient } from '@/components/storefront/MyOrdersClient';
import { buyerTypeLabels, type BuyerType } from '@/lib/validators/storefront.validator';
import { requireBuyerPage } from '@/server/services/buyer-session';

export const metadata: Metadata = { title: 'Mes commandes — SenagrOS' };

export default async function MyOrdersPage() {
  const { profile } = await requireBuyerPage('/mes-commandes');
  return (
    <div className="mx-auto max-w-5xl px-4">
      <Breadcrumb items={[{ label: 'Mes commandes' }]} />
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-ink">Mes commandes</h1>
        <p className="text-sm text-muted">
          {profile.companyName ?? profile.contactName} — compte{' '}
          {buyerTypeLabels[profile.buyerType as BuyerType]}
        </p>
      </div>
      <MyOrdersClient />
    </div>
  );
}
