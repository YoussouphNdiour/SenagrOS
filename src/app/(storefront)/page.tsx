import { ArrowRight, Banknote, Leaf, MapPin, Star, Tractor, Truck } from 'lucide-react';
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

const PROMOS = [
  {
    title: 'Légumes des Niayes',
    text: 'Tomates, oignons, gombo : récoltés cette semaine',
    href: '/catalogue?categorie=legumes',
    photo: '/storefront/photos/promo-legumes.jpg',
  },
  {
    title: 'Céréales du bassin arachidier',
    text: 'Mil, maïs et riz local, prix de gros dès 50 kg',
    href: '/catalogue?categorie=cereales',
    photo: '/storefront/photos/promo-cereales.jpg',
  },
];

const PROMISES = [
  {
    icon: Tractor,
    title: 'Direct producteur',
    text: 'Vous achetez directement aux fermes sénégalaises, sans intermédiaire.',
  },
  {
    icon: Leaf,
    title: 'Fraîcheur garantie',
    text: 'Date de récolte et durée de conservation affichées pour chaque produit.',
  },
  {
    icon: Truck,
    title: 'Livraison dans tout le pays',
    text: 'Dakar en 24 h, les régions en 2 à 4 jours selon la zone choisie.',
  },
  {
    icon: Banknote,
    title: 'Payez comme vous voulez',
    text: 'À la livraison, avec Wave ou Orange Money. Prix pro pour les commerces.',
  },
];

export default async function StorefrontHomePage() {
  const session = await auth();
  const buyerType = await buyerTypeForUser(db, session?.user?.id);
  const [categories, popular, producers] = await Promise.all([
    listCategories(db),
    listProducts(db, { sort: 'relevance', page: 1, limit: 10 }, buyerType),
    listProducers(db, 6),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-xl bg-[#f3efe6]">
        {/* biome-ignore lint/performance/noImgElement: static hero photo */}
        <img
          src="/storefront/photos/hero.jpg"
          alt=""
          className="absolute inset-y-0 right-0 hidden h-full w-3/5 object-cover md:block"
        />
        <div className="absolute inset-y-0 left-[40%] hidden w-1/3 bg-gradient-to-r from-[#f3efe6] to-transparent md:block" />
        <div className="relative max-w-xl px-6 py-14 sm:px-12 md:py-24">
          <span className="inline-block rounded bg-accent px-2.5 py-1 text-xs font-semibold text-ink">
            Livraison en 24 h à Dakar
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-ink md:text-5xl">
            Produits frais du champ <span className="text-brand">à votre table</span>
          </h1>
          <p className="mt-4 text-lg text-muted">
            Légumes des Niayes, céréales du bassin arachidier, fruits de Casamance : commandez en
            direct aux producteurs, au juste prix.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-black"
            >
              Découvrir <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {!session?.user && (
              <Link
                href="/inscription-acheteur"
                className="inline-flex items-center rounded-md border border-ink/20 bg-white/70 px-5 py-3 text-sm font-semibold text-ink hover:bg-white"
              >
                Compte pro : superette, grande surface
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-14" aria-labelledby="rayons">
        <h2 id="rayons" className="mb-6 text-2xl font-semibold text-ink">
          Nos rayons
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(({ category, count }) => {
            const visual = CATEGORY_VISUALS[category as ListingCategory] ?? CATEGORY_VISUALS.autres;
            return (
              <li key={category}>
                <Link
                  href={`/catalogue?categorie=${category}`}
                  className="flex flex-col items-center rounded-lg border border-line bg-white px-3 py-5 text-center transition hover:border-brand hover:shadow-md"
                >
                  {/* biome-ignore lint/performance/noImgElement: static category photo */}
                  <img src={visual.photo} alt="" className="h-20 w-20 rounded-full object-cover" />
                  <span className="mt-3 font-medium text-ink">
                    {listingCategoryLabels[category as ListingCategory] ?? category}
                  </span>
                  <span className="text-xs text-muted">
                    {count} produit{count > 1 ? 's' : ''}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Promo banners */}
      <section className="mt-10 grid gap-6 md:grid-cols-2" aria-label="Sélections du moment">
        {PROMOS.map((promo) => (
          <div key={promo.href} className="relative overflow-hidden rounded-xl bg-surface">
            {/* biome-ignore lint/performance/noImgElement: static banner photo */}
            <img
              src={promo.photo}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-[45%] object-cover"
            />
            <div className="absolute inset-y-0 left-[55%] w-16 bg-gradient-to-r from-surface to-transparent" />
            <div className="relative w-[55%] p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-ink">{promo.title}</h3>
              <p className="mt-2 text-sm text-muted">{promo.text}</p>
              <Link
                href={promo.href}
                className="mt-5 inline-flex items-center rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
              >
                Voir les produits
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Popular products */}
      <section className="mt-14" aria-labelledby="populaires">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="populaires" className="text-2xl font-semibold text-ink">
            Produits populaires
          </h2>
          <Link href="/catalogue" className="text-sm font-medium text-brand hover:text-brand-dark">
            Tout voir →
          </Link>
        </div>
        {popular.items.length === 0 ? (
          <p className="rounded-lg border border-line p-8 text-center text-muted">
            Aucun produit publié pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {popular.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Producers */}
      {producers.length > 0 && (
        <section id="producteurs" className="mt-14 scroll-mt-40" aria-labelledby="producteurs-titre">
          <h2 id="producteurs-titre" className="mb-6 text-2xl font-semibold text-ink">
            Nos producteurs
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {producers.map((farm) => (
              <li key={farm.id}>
                <Link
                  href={`/catalogue?ferme=${farm.id}`}
                  className="flex h-full items-start gap-4 rounded-lg border border-line bg-white p-5 transition hover:border-brand hover:shadow-md"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand">
                    {farm.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{farm.name}</span>
                    {farm.description && (
                      <span className="mt-1 line-clamp-2 block text-sm text-muted">
                        {farm.description}
                      </span>
                    )}
                    <span className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>
                        {farm.listingCount} produit{farm.listingCount > 1 ? 's' : ''}
                      </span>
                      {farm.regions.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden /> {farm.regions.join(', ')}
                        </span>
                      )}
                      {farm.avgRating && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
                          {Number(farm.avgRating).toFixed(1)}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How it works */}
      <section id="comment-ca-marche" className="mt-16 scroll-mt-40" aria-labelledby="ccm">
        <h2 id="ccm" className="mb-8 text-2xl font-semibold text-ink">
          Comment ça marche
        </h2>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => (
            <li key={item.title}>
              <item.icon className="h-10 w-10 text-brand" strokeWidth={1.5} aria-hidden />
              <p className="mt-4 text-lg font-semibold text-ink">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
