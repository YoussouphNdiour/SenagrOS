'use client';

import { Home, Sprout, Plus, Map, MoreHorizontal, FileText, Eye, Package, Calendar, ClipboardList, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const t = useTranslations('nav');

  const moreLinks = [
    { label: t('logs'), href: '/logs', icon: FileText },
    { label: t('observations'), href: '/observations', icon: Eye },
    { label: t('intrants'), href: '/intrants', icon: Package },
    { label: t('calendar'), href: '/calendrier', icon: Calendar },
    { label: t('plans'), href: '/plans', icon: ClipboardList },
    { label: t('reports'), href: '/reports', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
      {/* More menu overlay */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-20 border-t border-gray-200 bg-white p-4 shadow-lg">
            <div className="grid grid-cols-3 gap-3">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs font-medium transition hover:bg-gray-50 ${
                      pathname.startsWith(item.href)
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-around px-2">
        {/* Accueil */}
        <Link
          href="/dashboard"
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
            pathname === '/dashboard' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className="h-5 w-5" />
          {t('home')}
        </Link>

        {/* Cultures */}
        <Link
          href="/assets/land"
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
            pathname.startsWith('/assets') ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Sprout className="h-5 w-5" />
          {t('cultures')}
        </Link>

        {/* Quick + (elevated) */}
        <Link
          href="/quick"
          className="flex flex-col items-center gap-1 py-1"
          aria-label="Actions rapides"
        >
          <div className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg ring-4 ring-white transition hover:bg-green-700">
            <Plus className="h-6 w-6" />
          </div>
          <span className="mt-1 text-[11px] font-medium text-green-600">Saisir</span>
        </Link>

        {/* Carte */}
        <Link
          href="/map"
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
            pathname === '/map' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Map className="h-5 w-5" />
          {t('map')}
        </Link>

        {/* Plus */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
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
