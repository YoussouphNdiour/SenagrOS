import { Store, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCart } from '@/components/storefront/AddToCart';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGallery } from '@/components/storefront/ProductGallery';
import { ReviewSummary } from '@/components/storefront/ReviewSummary';
import { StarRating } from '@/components/storefront/StarRating';
import {
  computeReviewStats,
  reviewSortEnum,
  reviewSortLabels,
} from '@/lib/validators/review.validator';
import {
  BUYER_TYPES,
  type BuyerType,
  buyerTypeLabels,
  buyerTypePriceLabels,
  formatQuantity,
  formatXof,
  type ListingCategory,
  type ListingUnit,
  listingCategoryLabels,
  listingUnitLabels,
} from '@/lib/validators/storefront.validator';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import {
  buyerTypeForUser,
  getProduct,
  listProductReviews,
  listProducts,
} from '@/server/services/storefront.service';

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REVIEWS_PER_PAGE = 5;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return {};
  const product = await getProduct(db, id, null);
  return product
    ? { title: `${product.name} — SenagrOS`, description: product.description ?? undefined }
    : {};
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const sp = await searchParams;
  const session = await auth();
  const buyerType = await buyerTypeForUser(db, session?.user?.id);

  const product = await getProduct(db, id, buyerType);
  if (!product) notFound();

  const sortParam = reviewSortEnum.safeParse(sp.avis_tri);
  const sort = sortParam.success ? sortParam.data : 'recent';
  const reviewPage = Math.max(1, Number(sp.avis_page) || 1);
  const reviewList = await listProductReviews(db, {
    listingId: id,
    sort,
    page: reviewPage,
    limit: REVIEWS_PER_PAGE,
  });
  const stats = computeReviewStats(product.ratingRows);
  const similar = (
    await listProducts(
      db,
      { category: product.category as ListingCategory, sort: 'relevance', page: 1, limit: 6 },
      buyerType,
    )
  ).items
    .filter((p) => p.id !== product.id)
    .slice(0, 5);
  const reviewPages = Math.ceil(reviewList.total / REVIEWS_PER_PAGE);

  const unit = listingUnitLabels[(product.unit ?? 'kg') as ListingUnit] ?? product.unit ?? 'kg';
  const stock = Number(product.stockAvailable);
  const minQuantity = Number(product.minOrderQuantity ?? 1);
  const ownTier = product.tiers.find((t) => t.buyerType === (buyerType ?? 'particulier'));
  const tierByType = new Map(product.tiers.map((t) => [t.buyerType, t]));
  const priceLabel = buyerTypePriceLabels[buyerType ?? 'particulier'];
  const base = Number(product.basePrice);
  const discount =
    base > product.displayPrice ? Math.round((1 - product.displayPrice / base) * 100) : 0;
  const categoryLabel =
    listingCategoryLabels[product.category as ListingCategory] ?? product.category;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

  const details: [string, React.ReactNode][] = [
    [
      'Disponibilité',
      <span key="stock" data-testid="stock">
        {stock > 0 ? `En stock · ${formatQuantity(stock)} ${unit}` : 'Rupture de stock'}
      </span>,
    ],
    ['Vente minimum', `${formatQuantity(minQuantity)} ${unit}`],
    ...(product.originRegion ? [['Origine', product.originRegion] as [string, string]] : []),
    ...(product.harvestDate ? [['Récolte', fmtDate(product.harvestDate)] as [string, string]] : []),
    ...(product.shelfLifeDays
      ? [['Conservation', `${product.shelfLifeDays} jours`] as [string, string]]
      : []),
    ...(product.isBio ? [['Qualité', 'Agriculture biologique'] as [string, string]] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4">
      <Breadcrumb
        items={[
          { label: categoryLabel, href: `/catalogue?categorie=${product.category}` },
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery photos={product.photos ?? []} name={product.name} />

        <div>
          <Link
            href={`/catalogue?categorie=${product.category}`}
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            {categoryLabel}
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <StarRating value={stats.average} size="sm" />
            <a href="#avis" className="text-brand hover:text-brand-dark">
              ({stats.count} avis)
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-2">
            <p className="text-3xl font-bold text-ink" data-testid="product-detail-price">
              {formatXof(product.displayPrice)}
              <span className="text-base font-normal text-muted"> /{unit}</span>
            </p>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted line-through">{formatXof(base)}</span>
                <span className="text-sm font-semibold text-red-700">-{discount}%</span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {priceLabel}
            {ownTier && Number(ownTier.minQuantity) > 1 &&
              ` · à partir de ${formatQuantity(ownTier.minQuantity ?? 1)} ${unit}`}
          </p>

          <hr className="my-6 border-line" />

          {/* 3-level price grid */}
          <div data-testid="price-grid">
            <p className="mb-3 text-sm font-semibold text-ink">Grille tarifaire</p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {BUYER_TYPES.map((type: BuyerType) => {
                const tier = tierByType.get(type);
                if (!tier && type !== 'particulier') return null;
                const isMine = (buyerType ?? 'particulier') === type;
                return (
                  <li
                    key={type}
                    className={`rounded-md border px-3 py-2.5 ${
                      isMine ? 'border-brand bg-brand-soft' : 'border-line'
                    }`}
                  >
                    <p className="text-xs text-muted">
                      {buyerTypeLabels[type]}
                      {isMine && buyerType && (
                        <span className="ml-1 font-semibold text-brand-dark">(vous)</span>
                      )}
                    </p>
                    <p className="font-semibold text-ink">
                      {formatXof(tier?.price ?? product.basePrice)}
                    </p>
                    <p className="text-xs text-muted">
                      dès {formatQuantity(tier?.minQuantity ?? product.minOrderQuantity ?? 1)}{' '}
                      {unit}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-6">
            <AddToCart
              listingId={product.id}
              unit={unit}
              minQuantity={minQuantity}
              stock={stock}
              initialQuantity={ownTier ? Number(ownTier.minQuantity ?? minQuantity) : minQuantity}
            />
          </div>

          <hr className="my-6 border-line" />

          <dl className="grid grid-cols-[9rem_1fr] gap-y-3 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-line p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Store className="h-5 w-5" aria-hidden />
            </span>
            <div className="text-sm">
              <Link
                href={`/catalogue?ferme=${product.farm.id}`}
                className="font-semibold text-ink hover:text-brand"
              >
                {product.farm.name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
                {product.farm.avgRating !== null && (
                  <StarRating
                    value={product.farm.avgRating}
                    size="sm"
                    showValue
                    count={product.farm.reviewCount}
                  />
                )}
                {product.farm.deliveryRegions.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-4 w-4" aria-hidden /> Livre :{' '}
                    {product.farm.deliveryRegions.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {product.description && (
        <section className="mt-14 max-w-3xl" aria-labelledby="description">
          <h2 id="description" className="mb-3 text-2xl font-semibold text-ink">
            Description
          </h2>
          <p className="whitespace-pre-line leading-relaxed text-muted">{product.description}</p>
        </section>
      )}

      <section id="avis" className="mt-14 scroll-mt-40" aria-labelledby="avis-titre">
        <h2 id="avis-titre" className="mb-6 text-2xl font-semibold text-ink">
          Avis clients
        </h2>
        <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
          <div className="h-fit rounded-lg border border-line p-6">
            <ReviewSummary stats={stats} />
          </div>
          <div>
            {reviewList.total > 0 && (
              <div className="mb-4 flex flex-wrap gap-2 text-sm">
                {reviewSortEnum.options.map((s) => (
                  <Link
                    key={s}
                    href={`/catalogue/${id}?avis_tri=${s}#avis`}
                    className={`rounded-md border px-3 py-1.5 ${
                      s === sort
                        ? 'border-brand bg-brand text-white'
                        : 'border-line text-ink hover:border-brand hover:text-brand'
                    }`}
                  >
                    {reviewSortLabels[s]}
                  </Link>
                ))}
              </div>
            )}
            {reviewList.items.length === 0 ? (
              <p className="rounded-lg border border-line p-6 text-muted">
                Aucun avis pour le moment. Les acheteurs peuvent noter un produit après livraison.
              </p>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {reviewList.items.map((r) => (
                  <li key={r.id} className="py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-ink">
                        {r.buyerName}
                        <span className="ml-2 text-xs font-normal text-muted">
                          {buyerTypeLabels[r.buyerType as BuyerType]}
                        </span>
                      </p>
                      <span className="text-xs text-muted">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}
                      </span>
                    </div>
                    <div className="mt-1">
                      <StarRating value={r.rating} size="sm" />
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-ink">{r.comment}</p>}
                    {r.sellerResponse && (
                      <div className="mt-3 rounded-md border-l-4 border-brand bg-surface p-3 text-sm">
                        <p className="font-semibold text-ink">Réponse de {product.farm.name}</p>
                        <p className="text-muted">{r.sellerResponse}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {reviewPages > 1 && (
              <nav className="mt-4 flex gap-2" aria-label="Pages d'avis">
                {Array.from({ length: reviewPages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={`/catalogue/${id}?avis_tri=${sort}&avis_page=${n}#avis`}
                    aria-current={n === reviewPage ? 'page' : undefined}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm ${
                      n === reviewPage
                        ? 'border-brand bg-brand text-white'
                        : 'border-line text-ink hover:border-brand'
                    }`}
                  >
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="mt-14" aria-labelledby="similaires">
          <h2 id="similaires" className="mb-6 text-2xl font-semibold text-ink">
            Produits similaires
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
