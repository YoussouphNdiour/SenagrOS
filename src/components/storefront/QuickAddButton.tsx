'use client';

import { Check, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';

interface QuickAddButtonProps {
  listingId: string;
  name: string;
  quantity: number;
  disabled?: boolean;
  /** `full` = full-width button (used on wide cards) */
  variant?: 'compact' | 'full';
  className?: string;
}

/** Adds the product's minimum quantity to the cart straight from a product card. */
export function QuickAddButton({
  listingId,
  name,
  quantity,
  disabled = false,
  variant = 'compact',
  className = '',
}: QuickAddButtonProps) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Ajouter ${name}`}
      onClick={() => {
        add(listingId, quantity);
        setAdded(true);
      }}
      className={`relative z-10 inline-flex items-center justify-center gap-1 rounded-md bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted ${
        variant === 'full' ? 'w-full py-2.5' : 'px-3 py-1.5'
      } ${className}`}
    >
      {added ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
      {added ? 'Ajouté' : 'Ajouter'}
    </button>
  );
}
