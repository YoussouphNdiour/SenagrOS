'use client';

import { MapPin, Leaf, Eye, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  productCategoryLabels,
  type ProductCategory,
} from '@/lib/validators/marketplace.validator';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    photoUrl?: string | null;
    pricePerKg: string | number;
    quantityAvailable: string | number;
    unit?: string | null;
    location?: string | null;
    isBio?: boolean | null;
    farmName?: string | null;
  };
  onView: (id: string) => void;
  onOrder?: (id: string) => void;
}

export function ProductCard({ product, onView, onOrder }: ProductCardProps) {
  const categoryLabel = productCategoryLabels[product.category as ProductCategory] ?? product.category;
  const price = Number(product.pricePerKg);
  const qty = Number(product.quantityAvailable);
  const unit = product.unit ?? 'kg';

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {product.photoUrl ? (
          <img
            src={product.photoUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {/* Location badge */}
        {product.location && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm">
            <MapPin className="h-3 w-3" />
            {product.location}
          </div>
        )}
        {/* Bio badge */}
        {product.isBio && (
          <div className="absolute left-2 top-10 flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-xs font-medium text-white">
            <Leaf className="h-3 w-3" />
            Bio
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <div className="mt-1">
          <Badge variant="default">
            {categoryLabel}
          </Badge>
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold text-green-700">
            {new Intl.NumberFormat('fr-SN').format(price)} FCFA
          </span>
          <span className="text-sm text-gray-500">/ {unit}</span>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          {new Intl.NumberFormat('fr-SN').format(qty)} {unit} disponibles
        </p>

        {product.farmName && (
          <p className="mt-1 text-xs text-gray-400">par {product.farmName}</p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onView(product.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            Voir le produit
          </button>
          {onOrder && (
            <button
              onClick={() => onOrder(product.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-800"
            >
              <ShoppingCart className="h-4 w-4" />
              Commander
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
