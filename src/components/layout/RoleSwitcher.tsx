'use client';

import { ShoppingBag, Store } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

type MarketRole = 'acheteur' | 'producteur';

export function RoleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const current: MarketRole = pathname.startsWith('/marketplace') ? 'acheteur' : 'producteur';

  function switchRole(role: MarketRole) {
    if (role === 'acheteur') {
      router.push('/marketplace');
    } else {
      router.push('/produits');
    }
  }

  return (
    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      <button
        onClick={() => switchRole('acheteur')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
          current === 'acheteur'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <ShoppingBag className="h-4 w-4" />
        Acheteur
      </button>
      <button
        onClick={() => switchRole('producteur')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
          current === 'producteur'
            ? 'bg-green-700 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Store className="h-4 w-4" />
        Producteur
      </button>
    </div>
  );
}
