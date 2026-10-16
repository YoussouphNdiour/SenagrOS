import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { CartPageClient } from '@/components/storefront/CartPageClient';

export const metadata: Metadata = { title: 'Mon panier — SenagrOS' };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      <Breadcrumb items={[{ label: 'Catalogue', href: '/catalogue' }, { label: 'Mon panier' }]} />
      <h1 className="mb-8 text-3xl font-semibold text-ink">Mon panier</h1>
      <CartPageClient />
    </div>
  );
}
