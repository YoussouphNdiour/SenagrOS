import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import {
  listReceivedOrdersSchema,
  orderIdSchema,
  type SellerAction,
  sellerTransitionSchema,
} from '@/lib/validators/order.validator';
import { buyerProfiles, orderItems, orders, productListings, reviews } from '../db/schema';
import { transitionOrder } from '../services/order.service';
import { router, sellerProcedure } from '../trpc';

function transitionProcedure(action: SellerAction) {
  return sellerProcedure
    .input(sellerTransitionSchema)
    .mutation(({ ctx, input }) =>
      transitionOrder(ctx.db, ctx.farmId, input.id, action, { codPaid: input.codPaid }),
    );
}

/** Seller-side storefront orders for the current user's farm. */
export const sellerOrdersRouter = router({
  getReceivedOrders: sellerProcedure
    .input(listReceivedOrdersSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [eq(orders.sellerFarmId, ctx.farmId)];
      if (input.status) conditions.push(eq(orders.status, input.status));
      if (input.from) conditions.push(gte(orders.createdAt, new Date(`${input.from}T00:00:00Z`)));
      if (input.to) conditions.push(lte(orders.createdAt, new Date(`${input.to}T23:59:59Z`)));
      const where = and(...conditions);

      const [items, [{ total }]] = await Promise.all([
        ctx.db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            subtotal: orders.subtotal,
            deliveryFee: orders.deliveryFee,
            totalAmount: orders.totalAmount,
            paymentMethod: orders.paymentMethod,
            paymentStatus: orders.paymentStatus,
            deliveryAddress: orders.deliveryAddress,
            deliveryCity: orders.deliveryCity,
            deliveryRegion: orders.deliveryRegion,
            deliveryPhone: orders.deliveryPhone,
            deliveryNotes: orders.deliveryNotes,
            estimatedDelivery: orders.estimatedDelivery,
            createdAt: orders.createdAt,
            buyerName: buyerProfiles.contactName,
            buyerCompany: buyerProfiles.companyName,
            buyerType: buyerProfiles.buyerType,
          })
          .from(orders)
          .innerJoin(buyerProfiles, eq(orders.buyerProfileId, buyerProfiles.id))
          .where(where)
          .orderBy(desc(orders.createdAt))
          .limit(input.limit)
          .offset((input.page - 1) * input.limit),
        ctx.db.select({ total: count() }).from(orders).where(where),
      ]);

      const lines = items.length
        ? await ctx.db
            .select()
            .from(orderItems)
            .where(
              inArray(
                orderItems.orderId,
                items.map((i) => i.id),
              ),
            )
            .orderBy(asc(orderItems.createdAt))
        : [];

      return {
        items: items.map((o) => ({ ...o, lines: lines.filter((l) => l.orderId === o.id) })),
        total: Number(total),
        page: input.page,
        limit: input.limit,
      };
    }),

  confirmOrder: transitionProcedure('confirm'),
  prepareOrder: transitionProcedure('prepare'),
  shipOrder: transitionProcedure('ship'),
  deliverOrder: transitionProcedure('deliver'),

  /** COD: the seller records that cash was collected on delivery. */
  markPaid: sellerProcedure.input(orderIdSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(orders)
      .set({
        paymentStatus: 'paid',
        updatedAt: new Date(),
        data: sql`${orders.data} || ${JSON.stringify({ paid_at: new Date().toISOString() })}::jsonb`,
      })
      .where(
        and(
          eq(orders.id, input.id),
          eq(orders.sellerFarmId, ctx.farmId),
          eq(orders.paymentMethod, 'cod'),
        ),
      )
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande COD introuvable' });
    return updated;
  }),

  stats: sellerProcedure.query(async ({ ctx }) => {
    const [[orderStats], [listingStats], [reviewStats]] = await Promise.all([
      ctx.db
        .select({
          revenue: sql<string>`coalesce(sum(${orders.totalAmount}) filter (where ${orders.status} = 'delivered'), 0)`,
          inProgress: sql<number>`count(*) filter (where ${orders.status} in ('pending', 'confirmed', 'preparing', 'shipped'))::int`,
          pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
          delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
          cancelled: sql<number>`count(*) filter (where ${orders.status} in ('cancelled', 'refunded'))::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(eq(orders.sellerFarmId, ctx.farmId)),
      ctx.db
        .select({
          published: sql<number>`count(*) filter (where ${productListings.isPublished})::int`,
          total: sql<number>`count(*)::int`,
        })
        .from(productListings)
        .where(and(eq(productListings.farmId, ctx.farmId), isNull(productListings.archivedAt))),
      ctx.db
        .select({
          average: sql<string | null>`avg(${reviews.rating})`,
          count: sql<number>`count(*)::int`,
        })
        .from(reviews)
        .innerJoin(productListings, eq(reviews.listingId, productListings.id))
        .where(eq(productListings.farmId, ctx.farmId)),
    ]);

    const closed = orderStats.delivered + orderStats.cancelled;
    return {
      revenue: Number(orderStats.revenue),
      inProgress: orderStats.inProgress,
      pending: orderStats.pending,
      totalOrders: orderStats.total,
      completionRate: closed ? Math.round((orderStats.delivered / closed) * 100) : 0,
      publishedListings: listingStats.published,
      totalListings: listingStats.total,
      averageRating: reviewStats.average ? Math.round(Number(reviewStats.average) * 10) / 10 : null,
      reviewCount: reviewStats.count,
    };
  }),
});
