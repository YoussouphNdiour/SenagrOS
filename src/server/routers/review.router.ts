import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import {
  computeReviewStats,
  createReviewSchema,
  listFarmReviewsSchema,
  listReviewsSchema,
  respondReviewSchema,
  reviewStatsSchema,
} from '@/lib/validators/review.validator';
import { buyerProfiles, orderItems, orders, productListings, reviews } from '../db/schema';
import { listProductReviews } from '../services/storefront.service';
import { buyerProcedure, publicProcedure, router, sellerProcedure } from '../trpc';

export const reviewRouter = router({
  /** A buyer may review each product of a delivered order once. */
  create: buyerProcedure.input(createReviewSchema).mutation(async ({ ctx, input }) => {
    const [line] = await ctx.db
      .select({ status: orders.status })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.id, input.orderId),
          eq(orders.buyerProfileId, ctx.buyer.id),
          eq(orderItems.listingId, input.listingId),
        ),
      )
      .limit(1);
    if (!line) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit absent de la commande' });
    if (line.status !== 'delivered') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Vous pourrez donner votre avis après la livraison',
      });
    }
    const [created] = await ctx.db
      .insert(reviews)
      .values({
        orderId: input.orderId,
        listingId: input.listingId,
        buyerProfileId: ctx.buyer.id,
        rating: input.rating,
        comment: input.comment || null,
      })
      .onConflictDoNothing()
      .returning();
    if (!created) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Vous avez déjà noté ce produit' });
    }
    return created;
  }),

  listByProduct: publicProcedure
    .input(listReviewsSchema)
    .query(({ ctx, input }) => listProductReviews(ctx.db, input)),

  /** Reviews on the seller's products (dashboard "Avis" tab). */
  listForMyFarm: sellerProcedure.input(listFarmReviewsSchema).query(async ({ ctx, input }) => {
    const conditions = [eq(productListings.farmId, ctx.farmId)];
    if (input.unansweredOnly) conditions.push(isNull(reviews.sellerResponse));
    const where = and(...conditions);
    const [items, [{ total }]] = await Promise.all([
      ctx.db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          sellerResponse: reviews.sellerResponse,
          createdAt: reviews.createdAt,
          productName: productListings.name,
          listingId: productListings.id,
          buyerName: buyerProfiles.contactName,
          orderNumber: orders.orderNumber,
        })
        .from(reviews)
        .innerJoin(productListings, eq(reviews.listingId, productListings.id))
        .innerJoin(buyerProfiles, eq(reviews.buyerProfileId, buyerProfiles.id))
        .innerJoin(orders, eq(reviews.orderId, orders.id))
        .where(where)
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit),
      ctx.db
        .select({ total: count() })
        .from(reviews)
        .innerJoin(productListings, eq(reviews.listingId, productListings.id))
        .where(where),
    ]);
    return { items, total: Number(total) };
  }),

  respondAsSeller: sellerProcedure.input(respondReviewSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(reviews)
      .set({ sellerResponse: input.response, updatedAt: new Date() })
      .where(
        and(
          eq(reviews.id, input.id),
          sql`${reviews.listingId} in (select id from product_listings where farm_id = ${ctx.farmId})`,
        ),
      )
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Avis introuvable' });
    return updated;
  }),

  getStats: publicProcedure.input(reviewStatsSchema).query(async ({ ctx, input }) => {
    const rows = await ctx.db
      .select({ rating: reviews.rating, count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(eq(reviews.listingId, input.listingId), eq(reviews.isVisible, true)))
      .groupBy(reviews.rating);
    return computeReviewStats(rows);
  }),
});
