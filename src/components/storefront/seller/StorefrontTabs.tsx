'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard/storefront', label: "Vue d'ensemble" },
  { href: '/dashboard/storefront/commandes', label: 'Commandes' },
  { href: '/dashboard/storefront/produits', label: 'Produits' },
  { href: '/dashboard/storefront/zones', label: 'Zones' },
  { href: '/dashboard/storefront/avis', label: 'Avis' },
];

export function StorefrontTabs() {
  const pathname = usePathname();
  return (
    <nav
      className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200"
      aria-label="Boutique en ligne"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
              active
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
