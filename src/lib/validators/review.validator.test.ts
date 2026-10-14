import { describe, expect, it } from 'vitest';
import {
  computeReviewStats,
  createReviewSchema,
  listReviewsSchema,
  respondReviewSchema,
} from './review.validator';

const ORDER = '11111111-1111-4111-8111-111111111111';
const LISTING = '33333333-3333-4333-8333-333333333333';

describe('createReviewSchema', () => {
  it('accepts ratings from 1 to 5', () => {
    for (const rating of [1, 3, 5]) {
      expect(
        createReviewSchema.safeParse({ orderId: ORDER, listingId: LISTING, rating }).success,
      ).toBe(true);
    }
  });

  it('rejects out-of-range or fractional ratings', () => {
    for (const rating of [0, 6, 4.5]) {
      expect(
        createReviewSchema.safeParse({ orderId: ORDER, listingId: LISTING, rating }).success,
      ).toBe(false);
    }
  });

  it('limits comment length', () => {
    expect(
      createReviewSchema.safeParse({
        orderId: ORDER,
        listingId: LISTING,
        rating: 4,
        comment: 'x'.repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe('listReviewsSchema', () => {
  it('defaults to most recent first', () => {
    expect(listReviewsSchema.parse({ listingId: LISTING })).toMatchObject({
      sort: 'recent',
      page: 1,
      limit: 10,
    });
  });
});

describe('respondReviewSchema', () => {
  it('requires a non-trivial response', () => {
    expect(respondReviewSchema.safeParse({ id: ORDER, response: ' ' }).success).toBe(false);
    expect(respondReviewSchema.safeParse({ id: ORDER, response: 'Merci !' }).success).toBe(true);
  });
});

describe('computeReviewStats', () => {
  it('computes average, count and distribution', () => {
    expect(
      computeReviewStats([
        { rating: 5, count: 3 },
        { rating: 4, count: 1 },
        { rating: 2, count: 1 },
      ]),
    ).toEqual({
      average: 4.2,
      count: 5,
      distribution: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 3 },
    });
  });

  it('handles products without reviews', () => {
    expect(computeReviewStats([])).toEqual({
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });

  it('ignores invalid ratings', () => {
    expect(computeReviewStats([{ rating: 9, count: 2 }]).count).toBe(0);
  });
});
