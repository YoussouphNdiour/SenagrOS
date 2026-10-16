import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
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
    <div className="mx-auto max-w-7xl px-4">
      <Breadcrumb
        items={
          input.category
            ? [{ label: 'Catalogue', href: '/catalogue' }, { label: title }]
            : [{ label: 'Catalogue' }]
        }
      />
      <div className="flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <CatalogueFilters categories={categories} regions={regions} />
        </Suspense>

        <section className="min-w-0 flex-1">
          <div className="rounded-lg bg-surface px-6 py-6 md:px-8 md:py-10">
            <h1 className="text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
            {buyerType && buyerType !== 'particulier' && (
              <p className="mt-2 text-sm text-muted">Vos prix professionnels sont affichés.</p>
            )}
          </div>

          <div className="my-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" data-testid="results-count">
              <span className="font-semibold text-ink">{result.total}</span> produit
              {result.total > 1 ? 's' : ''} trouvé{result.total > 1 ? 's' : ''}
            </p>
            <Suspense>
              <CatalogueSort />
            </Suspense>
          </div>

          {result.items.length === 0 ? (
            <div className="rounded-lg border border-line p-12 text-center">
              <p className="text-ink">Aucun produit ne correspond à votre recherche.</p>
              <Link
                href="/catalogue"
                className="mt-3 inline-block text-sm font-medium text-brand hover:text-brand-dark"
              >
                Voir tout le catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {result.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={pageHref(n)}
                  aria-current={n === result.page ? 'page' : undefined}
                  className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm ${
                    n === result.page
                      ? 'border-brand bg-brand font-semibold text-white'
                      : 'border-line text-ink hover:border-brand hover:text-brand'
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
