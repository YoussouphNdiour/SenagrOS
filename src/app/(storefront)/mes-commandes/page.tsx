import type { Metadata } from 'next';
import { MyOrdersClient } from '@/components/storefront/MyOrdersClient';
import { buyerTypeLabels, type BuyerType } from '@/lib/validators/storefront.validator';
import { requireBuyerPage } from '@/server/services/buyer-session';

export const metadata: Metadata = { title: 'Mes commandes — SenagrOS' };

export default async function MyOrdersPage() {
  const { profile } = await requireBuyerPage('/mes-commandes');
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mes commandes</h1>
        <p className="text-sm text-gray-500">
          {profile.companyName ?? profile.contactName} — compte{' '}
          {buyerTypeLabels[profile.buyerType as BuyerType]}
        </p>
      </div>
      <MyOrdersClient />
    </div>
  );
}
