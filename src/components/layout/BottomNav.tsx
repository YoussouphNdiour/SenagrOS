'use client';

import { ClipboardList, Home, Map, Package, Sprout } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const bottomNavItems = [
  { label: 'Accueil', href: '/dashboard', icon: Home },
  { label: 'Parcelles', href: '/dashboard/parcelles', icon: Map },
  { label: 'Cultures', href: '/dashboard/cultures', icon: Sprout },
  { label: 'Activités', href: '/dashboard/activites', icon: ClipboardList },
  { label: 'Intrants', href: '/dashboard/intrants', icon: Package },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
      <div className="flex items-center justify-around">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition ${
                isActive
                  ? 'text-green-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-green-600' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
