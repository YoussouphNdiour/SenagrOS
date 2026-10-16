'use client';

import {
  ChevronDown,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Search,
  ShoppingBag,
  ShoppingBasket,
  User,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  type ListingCategory,
  listingCategoryEnum,
  listingCategoryLabels,
} from '@/lib/validators/storefront.validator';
import { useCart } from './CartProvider';

interface StorefrontHeaderProps {
  user: { name: string; role: string } | null;
}

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/catalogue?categorie=legumes', label: 'Légumes' },
  { href: '/catalogue?categorie=fruits', label: 'Fruits' },
  { href: '/catalogue?categorie=cereales', label: 'Céréales' },
  { href: '/catalogue?bio=1', label: 'Bio' },
  { href: '/#producteurs', label: 'Producteurs' },
];

export function StorefrontHeader({ user }: StorefrontHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const departments = useRef<HTMLDetailsElement>(null);
  const { count } = useCart();
  const isBuyer = user?.role === 'buyer';
  const unread = trpc.order.unreadUpdates.useQuery(undefined, {
    enabled: isBuyer,
    refetchInterval: 60_000,
  });

  // Close the departments menu on navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on route change only
  useEffect(() => {
    if (departments.current) departments.current.open = false;
  }, [pathname, searchParams]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/catalogue?q=${encodeURIComponent(q)}` : '/catalogue');
  };

  const accountHref = isBuyer ? '/mes-commandes' : user ? '/dashboard' : '/login';

  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* Announcement bar */}
      <div className="bg-surface text-xs text-muted">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <p className="truncate">
            Produits frais livrés partout au Sénégal · Paiement à la livraison, Wave et Orange Money
          </p>
          {!user && (
            <Link href="/login" className="shrink-0 font-medium text-ink hover:text-brand">
              Espace producteur
            </Link>
          )}
        </div>
      </div>

      {/* Main row */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 md:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-2xl font-bold text-ink">
            <ShoppingBasket className="h-7 w-7 text-brand" aria-hidden />
            <span className="hidden sm:inline">SenagrOS</span>
          </Link>

          <search className="flex-1">
            <form onSubmit={onSearch} className="relative max-w-xl">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit : tomates, mil, mangues…"
                aria-label="Rechercher un produit"
                className="w-full rounded-md border border-line py-2.5 pl-4 pr-11 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                aria-label="Lancer la recherche"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-2 text-muted hover:text-brand"
              >
                <Search className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </search>

          <nav className="flex shrink-0 items-center gap-1 sm:gap-3" aria-label="Mon compte">
            {isBuyer ? (
              <Link
                href="/mes-commandes"
                className="relative flex items-center gap-2 rounded-md p-2 text-ink hover:text-brand"
              >
                <Package className="h-6 w-6" aria-hidden />
                <span className="hidden text-sm font-medium lg:inline">Mes commandes</span>
                {!!unread.data && (
                  <span className="absolute -top-0.5 left-6 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink">
                    {unread.data}
                  </span>
                )}
              </Link>
            ) : user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md p-2 text-ink hover:text-brand"
              >
                <LayoutDashboard className="h-6 w-6" aria-hidden />
                <span className="hidden text-sm font-medium lg:inline">Tableau de bord</span>
              </Link>
            ) : (
              <Link
                href={accountHref}
                className="flex items-center gap-2 rounded-md p-2 text-ink hover:text-brand"
              >
                <User className="h-6 w-6" aria-hidden />
                <span className="hidden text-sm font-medium lg:inline">Se connecter</span>
              </Link>
            )}

            {user && (
              <button
                type="button"
                onClick={async () => {
                  // Relative redirect: stay on the host the user is browsing (localhost or LAN IP)
                  await signOut({ redirect: false });
                  window.location.href = '/';
                }}
                className="rounded-md p-2 text-muted hover:text-ink"
                title={`Se déconnecter (${user.name})`}
                aria-label="Se déconnecter"
              >
                <LogOut className="h-5 w-5" aria-hidden />
              </button>
            )}

            <Link
              href="/panier"
              className="relative rounded-md p-2 text-ink hover:text-brand"
              aria-label={`Panier (${count} article${count > 1 ? 's' : ''})`}
              data-testid="cart-link"
            >
              <ShoppingBag className="h-6 w-6" aria-hidden />
              {count > 0 && (
                <span
                  data-testid="cart-count"
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-white"
                >
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Navigation row */}
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 pb-3">
          <details ref={departments} className="relative shrink-0">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark [&::-webkit-details-marker]:hidden">
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Tous les rayons
              <ChevronDown className="h-4 w-4" aria-hidden />
            </summary>
            <ul className="absolute left-0 top-full z-50 mt-2 w-60 rounded-lg border border-line bg-white py-2 shadow-lg">
              {listingCategoryEnum.options.map((c: ListingCategory) => (
                <li key={c}>
                  <Link
                    href={`/catalogue?categorie=${c}`}
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface hover:text-brand"
                  >
                    {listingCategoryLabels[c]}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
          <nav aria-label="Navigation principale" className="min-w-0 flex-1 overflow-x-auto">
            <ul className="flex items-center gap-1 whitespace-nowrap">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
