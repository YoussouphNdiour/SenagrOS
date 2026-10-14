import type { Metadata } from 'next';
import { CartPageClient } from '@/components/storefront/CartPageClient';

export const metadata: Metadata = { title: 'Mon panier — SenagrOS' };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Mon panier</h1>
      <CartPageClient />
    </div>
  );
}
