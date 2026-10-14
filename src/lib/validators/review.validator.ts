import { z } from 'zod';

export const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  listingId: z.string().uuid(),
  rating: z.number().int().min(1, 'Note minimum : 1').max(5, 'Note maximum : 5'),
  comment: z.string().trim().max(2000).optional(),
});
export type CreateReviewInput = z.input<typeof createReviewSchema>;

export const reviewSortEnum = z.enum(['recent', 'rating_desc', 'rating_asc']);
export type ReviewSort = z.infer<typeof reviewSortEnum>;

export const reviewSortLabels: Record<ReviewSort, string> = {
  recent: 'Plus récents',
  rating_desc: 'Meilleures notes',
  rating_asc: 'Notes les plus basses',
};

export const listReviewsSchema = z.object({
  listingId: z.string().uuid(),
  sort: reviewSortEnum.default('recent'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

export const listFarmReviewsSchema = z.object({
  unansweredOnly: z.boolean().default(false),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const respondReviewSchema = z.object({
  id: z.string().uuid(),
  response: z.string().trim().min(2, 'Réponse trop courte').max(2000),
});

export const reviewStatsSchema = z.object({ listingId: z.string().uuid() });

export interface ReviewStats {
  average: number;
  count: number;
  /** distribution[1..5] = number of reviews with that rating */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/** Computes average (1 decimal), count and 1-5 distribution from rating/count rows. */
export function computeReviewStats(rows: { rating: number; count: number }[]): ReviewStats {
  const distribution: ReviewStats['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let sum = 0;
  for (const row of rows) {
    if (row.rating < 1 || row.rating > 5) continue;
    const r = row.rating as 1 | 2 | 3 | 4 | 5;
    distribution[r] += Number(row.count);
    count += Number(row.count);
    sum += r * Number(row.count);
  }
  return { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution };
}
