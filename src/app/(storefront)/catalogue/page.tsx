import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CatalogueFilters, CatalogueSort } from '@/components/storefront/CatalogueFilters';
import { ProductCard } from '@/components/storefront/ProductCard';
import {
  type ListingCategory,
  listingCategoryLabels,
  parseCatalogueParams,
} from '@/lib/validators/storefront.validator';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import {
  buyerTypeForUser,
  listCategories,
  listProducts,
  listRegions,
} from '@/server/services/storefront.service';

export const metadata: Metadata = {
  title: 'Catalogue — SenagrOS',
  description: 'Céréales, légumes, fruits et tubercules frais des fermes du Sénégal.',
};

interface CataloguePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const raw = await searchParams;
  const input = parseCatalogueParams(raw);
  const session = await auth();
  const buyerType = await buyerTypeForUser(db, session?.user?.id);

  const [result, categories, regions] = await Promise.all([
    listProducts(db, input, buyerType),
    listCategories(db),
    listRegions(db),
  ]);

  const pageHref = (page: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') next.set(k, v);
    next.set('page', String(page));
    return `/catalogue?${next.toString()}`;
  };

  const title = input.category
    ? listingCategoryLabels[input.category as ListingCategory]
    : input.search
      ? `Résultats pour « ${input.search} »`
      : 'Tous les produits';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Suspense>
          <CatalogueFilters categories={categories} regions={regions} />
        </Suspense>

        <section className="flex-1">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
              <p className="text-sm text-gray-500" data-testid="results-count">
                {result.total} produit{result.total > 1 ? 's' : ''}
                {buyerType &&
                  buyerType !== 'particulier' &&
                  ' — vos prix professionnels sont affichés'}
              </p>
            </div>
            <div className="hidden lg:block">
              <Suspense>
                <CatalogueSort />
              </Suspense>
            </div>
          </div>

          {result.items.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center">
              <p className="text-gray-600">Aucun produit ne correspond à votre recherche.</p>
              <Link
                href="/catalogue"
                className="mt-3 inline-block text-sm text-green-700 hover:underline"
              >
                Voir tout le catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {result.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={pageHref(n)}
                  aria-current={n === result.page ? 'page' : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${
                    n === result.page
                      ? 'bg-green-600 font-semibold text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
