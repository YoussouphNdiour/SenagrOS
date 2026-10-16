import type { ReviewStats } from '@/lib/validators/review.validator';
import { StarRating } from './StarRating';

export function ReviewSummary({ stats }: { stats: ReviewStats }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center sm:w-40">
        <p className="text-4xl font-bold text-ink">
          {stats.count ? stats.average.toFixed(1) : '—'}
        </p>
        <StarRating value={stats.average} />
        <p className="mt-1 text-sm text-muted">{stats.count} avis</p>
      </div>
      <div className="flex-1 space-y-1">
        {([5, 4, 3, 2, 1] as const).map((r) => {
          const n = stats.distribution[r];
          const pct = stats.count ? (n / stats.count) * 100 : 0;
          return (
            <div key={r} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-ink">{r}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right text-muted">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
