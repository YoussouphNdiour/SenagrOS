'use client';

import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './CartProvider';

interface AddToCartProps {
  listingId: string;
  unit: string;
  minQuantity: number;
  stock: number;
  /** Suggested starting quantity, e.g. the buyer's tier minimum. */
  initialQuantity?: number;
}

export function AddToCart({
  listingId,
  unit,
  minQuantity,
  stock,
  initialQuantity,
}: AddToCartProps) {
  const { add } = useCart();
  const start = Math.min(Math.max(initialQuantity ?? minQuantity, minQuantity), stock);
  const [quantity, setQuantity] = useState(start > 0 ? start : minQuantity);
  const [added, setAdded] = useState(false);
  const step = minQuantity >= 1 ? 1 : minQuantity;

  if (stock <= 0) {
    return (
      <p className="rounded-lg bg-gray-100 p-3 text-center text-gray-600">
        Produit en rupture de stock
      </p>
    );
  }

  const clamp = (q: number) => Math.min(Math.max(q, minQuantity), stock);
  const invalid = quantity < minQuantity || quantity > stock;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-gray-300 bg-white">
          <button
            type="button"
            aria-label="Diminuer la quantité"
            onClick={() => setQuantity((q) => clamp(q - step))}
            className="p-3 text-gray-600 hover:bg-gray-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            aria-label="Quantité"
            data-testid="quantity-input"
            min={minQuantity}
            max={stock}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20 border-x border-gray-300 py-2 text-center text-sm focus:outline-none"
          />
          <button
            type="button"
            aria-label="Augmenter la quantité"
            onClick={() => setQuantity((q) => clamp(q + step))}
            className="p-3 text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
      {invalid && (
        <p className="text-sm text-red-600">
          Quantité entre {minQuantity} et {stock} {unit}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={invalid}
          onClick={() => {
            add(listingId, quantity);
            setAdded(true);
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
          {added ? 'Ajouté au panier' : 'Ajouter au panier'}
        </button>
        {added && (
          <Link
            href="/panier"
            className="inline-flex items-center rounded-lg border border-green-600 px-4 py-3 font-semibold text-green-700 hover:bg-green-50"
          >
            Voir le panier
          </Link>
        )}
      </div>
    </div>
  );
}
