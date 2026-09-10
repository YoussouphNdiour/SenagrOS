'use client';

import { X, MapPin, Leaf, ShoppingCart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import {
  productCategoryLabels,
  type ProductCategory,
} from '@/lib/validators/marketplace.validator';

interface ProductDetailModalProps {
  productId: string;
  onClose: () => void;
  onOrder: (id: string) => void;
}

export function ProductDetailModal({ productId, onClose, onOrder }: ProductDetailModalProps) {
  const { data: product, isLoading } = trpc.marketplace.getProduct.useQuery({ productId });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Détail du produit</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          </div>
        ) : product ? (
          <div className="p-4 space-y-4">
            {/* Image */}
            {product.photoUrl ? (
              <img
                src={product.photoUrl}
                alt={product.name}
                className="h-56 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-lg bg-gray-100">
                <ShoppingCart className="h-16 w-16 text-gray-300" />
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="default">
                  {productCategoryLabels[product.category as ProductCategory] ?? product.category}
                </Badge>
                {product.isBio && (
                  <Badge variant="success">
                    Bio
                  </Badge>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-gray-600">{product.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Prix</span>
                <p className="text-lg font-bold text-green-700">
                  {new Intl.NumberFormat('fr-SN').format(Number(product.pricePerKg))} FCFA / kg
                </p>
              </div>
              <div>
                <span className="text-gray-500">Disponible</span>
                <p className="font-semibold">
                  {new Intl.NumberFormat('fr-SN').format(Number(product.quantityAvailable))} kg
                </p>
              </div>
              {product.location && (
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {product.location}
                </div>
              )}
              {product.farmName && (
                <div className="text-gray-600">
                  Ferme : <span className="font-medium">{product.farmName}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onOrder(product.id)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 font-medium text-white transition hover:bg-green-800"
            >
              <ShoppingCart className="h-5 w-5" />
              Commander ce produit
            </button>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">Produit introuvable.</div>
        )}
      </div>
    </div>
  );
}
