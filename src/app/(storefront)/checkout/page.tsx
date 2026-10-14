import type { Metadata } from 'next';
import { CheckoutClient } from '@/components/storefront/CheckoutClient';
import { requireBuyerPage } from '@/server/services/buyer-session';

export const metadata: Metadata = { title: 'Commande — SenagrOS' };

export default async function CheckoutPage() {
  const { profile } = await requireBuyerPage('/checkout');
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Finaliser ma commande</h1>
      <CheckoutClient
        profile={{
          address: profile.address,
          city: profile.city,
          region: profile.region,
          phone: profile.phone,
          paymentPreference: profile.paymentPreference,
        }}
      />
    </div>
  );
}
