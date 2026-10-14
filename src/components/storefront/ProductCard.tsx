import { Leaf, MapPin } from 'lucide-react';
import Link from 'next/link';
import {
  formatXof,
  listingUnitLabels,
  type ListingUnit,
} from '@/lib/validators/storefront.validator';
import { listingPhoto } from './photos';
import { StarRating } from './StarRating';

export interface ProductCardData {
  id: string;
  name: string;
  photos: { url: string; alt?: string }[] | null;
  displayPrice: number;
  unit: string | null;
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

  return (
    <Link
      href={`/catalogue/${product.id}`}
      data-testid="product-card"
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* biome-ignore lint/performance/noImgElement: local SVG placeholders and seller URLs */}
        <img
          src={photo.url}
          alt={photo.alt ?? product.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        {product.isBio && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
            <Leaf className="h-3 w-3" /> Bio
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-gray-800/80 px-2 py-0.5 text-xs text-white">
            Rupture
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 font-semibold text-gray-800">{product.name}</h3>
        <p className="line-clamp-1 text-xs text-gray-500">{product.farmName}</p>
        {product.originRegion && (
          <p className="inline-flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" /> {product.originRegion}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <p className="text-lg font-bold text-green-700" data-testid="product-price">
            {formatXof(product.displayPrice)}
            <span className="text-xs font-normal text-gray-500"> /{unit}</span>
          </p>
          {product.avgRating !== null && (
            <StarRating value={product.avgRating} size="sm" count={product.reviewCount} />
          )}
        </div>
      </div>
    </Link>
  );
}
