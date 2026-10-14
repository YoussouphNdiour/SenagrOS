import { ArrowRight, MapPin, MousePointerClick, ShoppingBasket, Star, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORY_VISUALS } from '@/components/storefront/categories';
import { ProductCard } from '@/components/storefront/ProductCard';
import { type ListingCategory, listingCategoryLabels } from '@/lib/validators/storefront.validator';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import {
  buyerTypeForUser,
  listCategories,
  listProducers,
  listProducts,
} from '@/server/services/storefront.service';

export const metadata: Metadata = {
  title: 'SenagrOS — Produits frais du champ à votre table',
  description:
    'Commandez des produits agricoles frais directement auprès des fermes du Sénégal : particuliers, superettes et grandes surfaces.',
};

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Choisissez',
    text: 'Parcourez les produits frais des fermes sénégalaises, filtrez par région ou catégorie.',
  },
  {
    icon: ShoppingBasket,
    title: 'Commandez',
    text: 'Prix adaptés à votre profil (détail, semi-gros, gros). Payez à la livraison, Wave ou Orange Money.',
  },
  {
    icon: Truck,
    title: 'Recevez',
    text: 'Le producteur prépare et livre votre commande. Suivez chaque étape en temps réel.',
  },
];

export default async function StorefrontHomePage() {
  const session = await auth();

  const buyerType = await buyerTypeForUser(db, session?.user?.id);
  const [categories, popular, producers] = await Promise.all([
    listCategories(db),
    listProducts(db, { sort: 'relevance', page: 1, limit: 8 }, buyerType),
    listProducers(db, 6),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              Directement des producteurs sénégalais
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Produits frais du champ à votre table
            </h1>
            <p className="mt-4 max-w-lg text-green-50">
              Légumes des Niayes, céréales du bassin arachidier, fruits de Casamance : commandez en
              direct, au juste prix, pour votre famille ou votre commerce.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-green-700 shadow hover:bg-green-50"
              >
                Découvrir <ArrowRight className="h-4 w-4" />
              </Link>
              {!session?.user && (
                <Link
                  href="/inscription-acheteur"
                  className="rounded-lg border border-white/60 px-6 py-3 font-semibold text-white hover:bg-white/10"
                >
                  Compte pro (superette, grande surface)
                </Link>
              )}
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-4 md:grid" aria-hidden="true">
            {popular.items.slice(0, 4).map((p) => (
              // biome-ignore lint/performance/noImgElement: local SVG placeholders
              <img
                key={p.id}
                src={p.photos?.[0]?.url ?? '/storefront/products/placeholder.svg'}
                alt=""
                className="aspect-square w-full rounded-2xl object-cover shadow-lg ring-4 ring-white/20"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Nos catégories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(({ category, count }) => {
            const key = category as ListingCategory;
            const visual = CATEGORY_VISUALS[key] ?? CATEGORY_VISUALS.autres;
            const Icon = visual.icon;
            return (
              <Link
                key={category}
                href={`/catalogue?categorie=${category}`}
                className="flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={`rounded-full p-4 ${visual.className}`}>
                  <Icon className="h-7 w-7" />
                </span>
                <span className="font-semibold text-gray-800">
                  {listingCategoryLabels[key] ?? category}
                </span>
                <span className="text-xs text-gray-500">
                  {count} produit{count > 1 ? 's' : ''}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular products */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Produits populaires</h2>
          <Link href="/catalogue" className="text-sm font-medium text-green-700 hover:underline">
            Tout voir →
          </Link>
        </div>
        {popular.items.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-gray-500">
            Aucun produit publié pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {popular.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Producers */}
      {producers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Nos producteurs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {producers.map((farm) => (
              <Link
                key={farm.id}
                href={`/catalogue?ferme=${farm.id}`}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 hover:shadow-md"
              >
                <p className="font-semibold text-gray-800">{farm.name}</p>
                {farm.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{farm.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span>
                    {farm.listingCount} produit{farm.listingCount > 1 ? 's' : ''}
                  </span>
                  {farm.regions.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {farm.regions.join(', ')}
                    </span>
                  )}
                  {farm.avgRating && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(farm.avgRating).toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="comment-ca-marche" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-800">Comment ça marche</h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col items-center text-center">
                <span className="relative mb-4 rounded-full bg-green-100 p-5 text-green-700">
                  <step.icon className="h-8 w-8" />
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <p className="text-lg font-semibold text-gray-800">{step.title}</p>
                <p className="mt-2 max-w-xs text-sm text-gray-500">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
