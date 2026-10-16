import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { CheckoutClient } from '@/components/storefront/CheckoutClient';
import { requireBuyerPage } from '@/server/services/buyer-session';

export const metadata: Metadata = { title: 'Commande — SenagrOS' };

export default async function CheckoutPage() {
  const { profile } = await requireBuyerPage('/checkout');
  return (
    <div className="mx-auto max-w-7xl px-4">
      <Breadcrumb items={[{ label: 'Mon panier', href: '/panier' }, { label: 'Commande' }]} />
      <h1 className="mb-8 text-3xl font-semibold text-ink">Finaliser ma commande</h1>
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
