import { MapPin } from 'lucide-react';
import Link from 'next/link';
import {
  formatXof,
  type ListingCategory,
  type ListingUnit,
  listingCategoryLabels,
  listingUnitLabels,
} from '@/lib/validators/storefront.validator';
import { listingPhoto } from './photos';
import { QuickAddButton } from './QuickAddButton';
import { StarRating } from './StarRating';

export interface ProductCardData {
  id: string;
  name: string;
  category: string;
  photos: { url: string; alt?: string }[] | null;
  basePrice: string;
  displayPrice: number;
  unit: string | null;
  minOrderQuantity: string | null;
  isBio: boolean | null;
  originRegion: string | null;
  farmName: string;
  avgRating: number | null;
  reviewCount: number;
  stockAvailable: string;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const photo = listingPhoto(product.photos);
  const unit = listingUnitLabels[(product.unit ?? 'kg') as ListingUnit] ?? product.unit;
  const outOfStock = Number(product.stockAvailable) <= 0;
  const base = Number(product.basePrice);
  // Pro buyers (superette, grande surface) see their tier price against the detail price
  const discount = base > product.displayPrice ? Math.round((1 - product.displayPrice / base) * 100) : 0;
  const minQty = Number(product.minOrderQuantity ?? 1);

  return (
    <article
      data-testid="product-card"
      className="@container group relative flex flex-col rounded-lg border border-line bg-white p-3 sm:p-4 transition hover:border-brand hover:shadow-[0_8px_24px_rgba(33,49,60,0.12)]"
    >
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
        {discount > 0 && (
          <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
        {product.isBio && (
          <span className="rounded bg-brand px-1.5 py-0.5 text-xs font-semibold text-white">Bio</span>
        )}
        {outOfStock && (
          <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-semibold text-white">Rupture</span>
        )}
      </div>

      <div className="mb-3 aspect-square overflow-hidden rounded-md bg-surface">
        {/* biome-ignore lint/performance/noImgElement: static photos served from /public */}
        <img
          src={photo.url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <p className="text-xs text-muted">
        {listingCategoryLabels[product.category as ListingCategory] ?? product.category}
      </p>
      <h3 className="mt-1 line-clamp-2 font-semibold text-ink">
        {/* Stretched link: the whole card opens the product page */}
        <Link
          href={`/catalogue/${product.id}`}
          className="after:absolute after:inset-0 after:content-[''] hover:text-brand focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-brand"
        >
          {product.name}
        </Link>
      </h3>
      <div className="mt-1 flex items-center gap-1 text-xs text-muted">
        {product.avgRating !== null ? (
          <>
            <StarRating value={product.avgRating} size="sm" />
            <span>
              {product.avgRating.toFixed(1)} ({product.reviewCount})
            </span>
          </>
        ) : (
          <span>Aucun avis</span>
        )}
      </div>
      <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
        {product.farmName}
        {product.originRegion && ` · ${product.originRegion}`}
      </p>

      {/* Narrow cards (2 columns on phones) stack price and button */}
      <div className="mt-auto flex flex-col gap-2 pt-4 @min-[13rem]:flex-row @min-[13rem]:items-end @min-[13rem]:justify-between">
        <div className="leading-tight">
          <p className="whitespace-nowrap font-bold text-ink" data-testid="product-price">
            {formatXof(product.displayPrice)}
          </p>
          <p className="text-xs text-muted">
            {discount > 0 && <span className="mr-1 line-through">{formatXof(base)}</span>}
            par {unit}
          </p>
        </div>
        <QuickAddButton
          listingId={product.id}
          name={product.name}
          quantity={minQty}
          disabled={outOfStock}
          className="w-full @min-[13rem]:w-auto"
        />
      </div>
    </article>
  );
}
