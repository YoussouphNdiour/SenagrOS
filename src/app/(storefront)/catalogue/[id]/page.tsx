import { Boxes, CalendarDays, Leaf, MapPin, Store, Timer, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCart } from '@/components/storefront/AddToCart';
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
  const reviewPages = Math.ceil(reviewList.total / REVIEWS_PER_PAGE);

  const unit = listingUnitLabels[(product.unit ?? 'kg') as ListingUnit] ?? product.unit ?? 'kg';
  const stock = Number(product.stockAvailable);
  const minQuantity = Number(product.minOrderQuantity ?? 1);
  const ownTier = product.tiers.find((t) => t.buyerType === (buyerType ?? 'particulier'));
  const tierByType = new Map(product.tiers.map((t) => [t.buyerType, t]));
  const priceLabel = buyerTypePriceLabels[buyerType ?? 'particulier'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-500" aria-label="Fil d'Ariane">
        <Link href="/catalogue" className="hover:text-green-700">
          Catalogue
        </Link>{' '}
        /{' '}
        <Link href={`/catalogue?categorie=${product.category}`} className="hover:text-green-700">
          {listingCategoryLabels[product.category as ListingCategory] ?? product.category}
        </Link>{' '}
        / <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery photos={product.photos ?? []} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {listingCategoryLabels[product.category as ListingCategory] ?? product.category}
            </span>
            {product.isBio && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <Leaf className="h-3 w-3" /> Bio
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">{product.name}</h1>
          {stats.count > 0 && (
            <a href="#avis" className="mt-2 inline-block">
              <StarRating value={stats.average} showValue count={stats.count} />
            </a>
          )}

          <div className="mt-5 rounded-xl bg-green-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-green-800">
              {priceLabel}
            </p>
            <p
              className="text-3xl font-extrabold text-green-700"
              data-testid="product-detail-price"
            >
              {formatXof(product.displayPrice)}
              <span className="text-base font-normal text-gray-600"> /{unit}</span>
            </p>
            {ownTier && Number(ownTier.minQuantity) > 1 && (
              <p className="text-xs text-gray-600">
                À partir de {formatQuantity(ownTier.minQuantity ?? 1)} {unit}
              </p>
            )}
          </div>

          {/* 3-level price grid */}
          <div
            className="mt-4 overflow-hidden rounded-xl ring-1 ring-gray-200"
            data-testid="price-grid"
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Profil</th>
                  <th className="px-4 py-2 font-medium">Prix /{unit}</th>
                  <th className="px-4 py-2 font-medium">Minimum</th>
                </tr>
              </thead>
              <tbody>
                {BUYER_TYPES.map((type: BuyerType) => {
                  const tier = tierByType.get(type);
                  if (!tier && type !== 'particulier') return null;
                  const isMine = (buyerType ?? 'particulier') === type;
                  return (
                    <tr
                      key={type}
                      className={`border-t border-gray-100 ${isMine ? 'bg-green-50 font-semibold' : ''}`}
                    >
                      <td className="px-4 py-2">
                        {buyerTypeLabels[type]}
                        {isMine && buyerType && (
                          <span className="ml-1 text-xs text-green-700">(vous)</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{formatXof(tier?.price ?? product.basePrice)}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {formatQuantity(tier?.minQuantity ?? product.minOrderQuantity ?? 1)} {unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Boxes className="h-4 w-4 text-gray-400" />
              <span data-testid="stock">
                {stock > 0 ? `${formatQuantity(stock)} ${unit} en stock` : 'Rupture de stock'}
              </span>
            </div>
            {product.originRegion && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" /> {product.originRegion}
              </div>
            )}
            {product.harvestDate && (
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarDays className="h-4 w-4 text-gray-400" /> Récolté le{' '}
                {new Date(product.harvestDate).toLocaleDateString('fr-FR')}
              </div>
            )}
            {product.shelfLifeDays && (
              <div className="flex items-center gap-2 text-gray-700">
                <Timer className="h-4 w-4 text-gray-400" /> Se conserve {product.shelfLifeDays}{' '}
                jours
              </div>
            )}
          </dl>

          <div className="mt-6">
            <AddToCart
              listingId={product.id}
              unit={unit}
              minQuantity={minQuantity}
              stock={stock}
              initialQuantity={ownTier ? Number(ownTier.minQuantity ?? minQuantity) : minQuantity}
            />
          </div>

          <div className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="flex items-center gap-2 font-semibold text-gray-800">
              <Store className="h-4 w-4 text-green-700" />
              <Link href={`/catalogue?ferme=${product.farm.id}`} className="hover:underline">
                {product.farm.name}
              </Link>
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
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
                  <Truck className="h-4 w-4" /> Livre : {product.farm.deliveryRegions.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {product.description && (
        <section className="mt-10 max-w-3xl">
          <h2 className="mb-3 text-xl font-bold text-gray-800">Description</h2>
          <p className="whitespace-pre-line text-gray-700">{product.description}</p>
        </section>
      )}

      <section id="avis" className="mt-10 max-w-3xl">
        <h2 className="mb-4 text-xl font-bold text-gray-800">Avis clients</h2>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <ReviewSummary stats={stats} />
        </div>

        {reviewList.total > 0 && (
          <div className="mt-4 flex gap-2 text-sm">
            {reviewSortEnum.options.map((s) => (
              <Link
                key={s}
                href={`/catalogue/${id}?avis_tri=${s}#avis`}
                className={`rounded-full px-3 py-1 ${s === sort ? 'bg-green-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200'}`}
              >
                {reviewSortLabels[s]}
              </Link>
            ))}
          </div>
        )}

        <ul className="mt-4 space-y-4">
          {reviewList.items.map((r) => (
            <li key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800">
                  {r.buyerName}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {buyerTypeLabels[r.buyerType as BuyerType]}
                  </span>
                </p>
                <span className="text-xs text-gray-400">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
              <StarRating value={r.rating} size="sm" />
              {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
              {r.sellerResponse && (
                <div className="mt-3 rounded-lg border-l-4 border-green-500 bg-green-50 p-3 text-sm">
                  <p className="font-medium text-green-800">Réponse de {product.farm.name}</p>
                  <p className="text-gray-700">{r.sellerResponse}</p>
                </div>
              )}
            </li>
          ))}
        </ul>

        {reviewPages > 1 && (
          <nav className="mt-4 flex gap-2" aria-label="Pages d'avis">
            {Array.from({ length: reviewPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={`/catalogue/${id}?avis_tri=${sort}&avis_page=${n}#avis`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${n === reviewPage ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}
