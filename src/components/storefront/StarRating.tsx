import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  count?: number;
}

const sizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' };

export function StarRating({ value, size = 'md', showValue = false, count }: StarRatingProps) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Note ${value} sur 5`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${sizes[size]} ${
              i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        ))}
      </span>
      {showValue && <span className="text-sm font-medium text-gray-700">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-gray-500">({count})</span>}
    </span>
  );
}
