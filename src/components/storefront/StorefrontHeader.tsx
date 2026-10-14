'use client';

import { LayoutDashboard, LogOut, Package, Search, ShoppingCart, Sprout, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useCart } from './CartProvider';

interface StorefrontHeaderProps {
  user: { name: string; role: string } | null;
}

export function StorefrontHeader({ user }: StorefrontHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const { count } = useCart();
  const isBuyer = user?.role === 'buyer';
  const unread = trpc.order.unreadUpdates.useQuery(undefined, {
    enabled: isBuyer,
    refetchInterval: 60_000,
  });

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/catalogue?q=${encodeURIComponent(q)}` : '/catalogue');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-xl font-bold text-green-700"
        >
          <Sprout className="h-6 w-6" />
          <span className="hidden sm:inline">SenagrOS</span>
        </Link>

        <search className="flex-1">
          <form onSubmit={onSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tomates, oignons, mil…"
              aria-label="Rechercher un produit"
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </form>
        </search>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/catalogue"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 md:block"
          >
            Catalogue
          </Link>

          {user ? (
            <>
              {isBuyer ? (
                <Link
                  href="/mes-commandes"
                  className="relative inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  title="Mes commandes"
                >
                  <Package className="h-5 w-5" />
                  <span className="hidden lg:inline">Mes commandes</span>
                  {!!unread.data && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                      {unread.data}
                    </span>
                  )}
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  title="Tableau de bord"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="hidden lg:inline">Tableau de bord</span>
                </Link>
              )}
              <span className="hidden items-center gap-1 px-2 text-sm text-gray-600 xl:inline-flex">
                <User className="h-4 w-4" /> {user.name}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              Se connecter
            </Link>
          )}

          <Link
            href="/panier"
            className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100"
            aria-label={`Panier (${count} article${count > 1 ? 's' : ''})`}
            data-testid="cart-link"
          >
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && (
              <span
                data-testid="cart-count"
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-xs font-bold text-white"
              >
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
