'use client';

import { Home, Map, MoreHorizontal, Plus, Sprout } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [moreOpen, setMoreOpen] = useState(false);

  const moreItems = [
    { label: t('logs'), href: '/logs' },
    { label: t('observations'), href: '/observations' },
    { label: t('intrants'), href: '/intrants' },
    { label: t('calendrier'), href: '/calendrier' },
    { label: t('plans'), href: '/plans' },
    { label: t('reports'), href: '/reports' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
      {/* More slide-up menu */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/20"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-20 border-t border-gray-200 bg-white p-4 shadow-lg">
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="rounded-lg bg-gray-50 p-3 text-center text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-around">
        {/* Accueil */}
        <Link
          href="/dashboard"
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition ${
            pathname === '/dashboard' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className="h-5 w-5" />
          {t('home')}
        </Link>

        {/* Cultures */}
        <Link
          href="/assets/land"
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition ${
            pathname.startsWith('/assets') ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Sprout className="h-5 w-5" />
          {t('cultures')}
        </Link>

        {/* Quick + button */}
        <Link href="/quick" className="flex flex-col items-center gap-1 py-1">
          <div className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-xs text-green-600">{t('quickAdd')}</span>
        </Link>

        {/* Carte */}
        <Link
          href="/map"
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition ${
            pathname === '/map' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Map className="h-5 w-5" />
          {t('map')}
        </Link>

        {/* Plus (more menu toggle) */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition ${
            moreOpen ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          {t('more')}
        </button>
      </div>
    </nav>
  );
}
