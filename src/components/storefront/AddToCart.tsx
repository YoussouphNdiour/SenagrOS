'use client';

import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
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
      <p className="rounded-md bg-surface p-3 text-center font-medium text-ink">
        Produit en rupture de stock
      </p>
    );
  }

  const clamp = (q: number) => Math.min(Math.max(q, minQuantity), stock);
  const invalid = quantity < minQuantity || quantity > stock;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border border-line bg-white">
          <button
            type="button"
            aria-label="Diminuer la quantité"
            onClick={() => setQuantity((q) => clamp(q - step))}
            className="px-3 py-2 text-ink hover:text-brand"
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
            className="w-16 border-x border-line py-2 text-center text-sm text-ink focus:outline-none"
          />
          <button
            type="button"
            aria-label="Augmenter la quantité"
            onClick={() => setQuantity((q) => clamp(q + step))}
            className="px-3 py-2 text-ink hover:text-brand"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm text-muted">{unit}</span>
      </div>
      {invalid && (
        <p className="text-sm text-red-700">
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
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-8 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {added ? <Check className="h-5 w-5" aria-hidden /> : <ShoppingBag className="h-5 w-5" aria-hidden />}
          {added ? 'Ajouté au panier' : 'Ajouter au panier'}
        </button>
        {added && (
          <Link
            href="/panier"
            className="inline-flex items-center rounded-md border border-ink px-5 py-3 font-semibold text-ink hover:bg-ink hover:text-white"
          >
            Voir le panier
          </Link>
        )}
      </div>
    </div>
  );
}
