import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  CANCEL_WINDOW_MINUTES,
  canCancelOrder,
  cancelOrderSchema,
  createOrderSchema,
  listMyOrdersSchema,
  orderIdSchema,
  reorderSchema,
  saveCartSchema,
} from '@/lib/validators/order.validator';
import {
  buyerProfiles,
  deliveryZones,
  farms,
  notifications,
  orderItems,
  orders,
  productListings,
  reviews,
} from '../db/schema';
import { createOrders, restoreStock } from '../services/order.service';
import { buyerProcedure, router } from '../trpc';

interface BuyerData {
  cart?: { listingId: string; quantity: number }[];
}

/** Buyer-side order management (authenticated buyer with a buyer profile). */
export const orderRouter = router({
  myProfile: buyerProcedure.query(({ ctx }) => ctx.buyer),

  createOrder: buyerProcedure.input(createOrderSchema).mutation(async ({ ctx, input }) => {
    const result = await createOrders(ctx.db, ctx.buyer, input);
    // Ordered items leave the persisted cart
    await ctx.db
      .update(buyerProfiles)
      .set({ data: { ...((ctx.buyer.data as BuyerData) ?? {}), cart: [] }, updatedAt: new Date() })
      .where(eq(buyerProfiles.id, ctx.buyer.id));
    return {
      checkoutRef: result.checkoutRef,
      orders: result.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
      })),
    };
  }),

  getMyOrders: buyerProcedure.input(listMyOrdersSchema).query(async ({ ctx, input }) => {
    const conditions = [eq(orders.buyerProfileId, ctx.buyer.id)];
    if (input.status) conditions.push(eq(orders.status, input.status));
    const where = and(...conditions);

    const [items, [{ total }]] = await Promise.all([
      ctx.db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          totalAmount: orders.totalAmount,
          paymentMethod: orders.paymentMethod,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
          estimatedDelivery: orders.estimatedDelivery,
          farmName: farms.name,
          itemCount: count(orderItems.id),
        })
        .from(orders)
        .innerJoin(farms, eq(orders.sellerFarmId, farms.id))
        .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(where)
        .groupBy(orders.id, farms.name)
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit),
      ctx.db.select({ total: count() }).from(orders).where(where),
    ]);
    return { items, total: Number(total), page: input.page, limit: input.limit };
  }),

  getOrder: buyerProcedure.input(orderIdSchema).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({ order: orders, farmName: farms.name, zoneName: deliveryZones.name })
      .from(orders)
      .innerJoin(farms, eq(orders.sellerFarmId, farms.id))
      .leftJoin(deliveryZones, eq(orders.deliveryZoneId, deliveryZones.id))
      .where(and(eq(orders.id, input.id), eq(orders.buyerProfileId, ctx.buyer.id)))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });

    const [items, myReviews] = await Promise.all([
      ctx.db
        .select({
          item: orderItems,
          photos: productListings.photos,
        })
        .from(orderItems)
        .leftJoin(productListings, eq(orderItems.listingId, productListings.id))
        .where(eq(orderItems.orderId, input.id))
        .orderBy(asc(orderItems.createdAt)),
      ctx.db.select().from(reviews).where(eq(reviews.orderId, input.id)),
      // Viewing an order marks its status notifications as read
      ctx.db
        .update(notifications)
        .set({ read: true })
        .where(
          and(eq(notifications.userId, ctx.session.user.id), eq(notifications.entityId, input.id)),
        ),
    ]);

    return {
      ...row.order,
      farmName: row.farmName,
      zoneName: row.zoneName,
      canCancel: canCancelOrder(row.order),
      cancelWindowMinutes: CANCEL_WINDOW_MINUTES,
      items: items.map(({ item, photos }) => ({ ...item, photo: photos?.[0]?.url ?? null })),
      reviews: myReviews,
    };
  }),

  cancelOrder: buyerProcedure.input(cancelOrderSchema).mutation(async ({ ctx, input }) => {
    const [order] = await ctx.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, input.id), eq(orders.buyerProfileId, ctx.buyer.id)))
      .limit(1);
    if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
    if (!canCancelOrder(order)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Annulation possible uniquement pour une commande en attente, dans les ${CANCEL_WINDOW_MINUTES} minutes`,
      });
    }

    const cancelled = await ctx.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: input.reason ?? 'Annulée par le client',
          updatedAt: new Date(),
        })
        .where(and(eq(orders.id, order.id), eq(orders.status, 'pending')))
        .returning();
      if (!updated) {
        throw new TRPCError({ code: 'CONFLICT', message: 'La commande a déjà été traitée' });
      }
      await restoreStock(tx, order.id);
      return updated;
    });

    const sellers = await ctx.db.query.users.findMany({
      where: (u, { and: a, eq: e, inArray: i }) =>
        a(e(u.farmId, order.sellerFarmId), i(u.role, ['owner', 'manager'])),
      columns: { id: true },
    });
    if (sellers.length) {
      await ctx.db.insert(notifications).values(
        sellers.map((s) => ({
          farmId: order.sellerFarmId,
          userId: s.id,
          type: 'order_status_change',
          title: `Commande ${order.orderNumber} annulée`,
          message: `Le client a annulé la commande ${order.orderNumber}.`,
          entityType: 'order',
          entityId: order.id,
        })),
      );
    }
    return cancelled;
  }),

  reorder: buyerProcedure.input(reorderSchema).mutation(async ({ ctx, input }) => {
    const [original] = await ctx.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, input.id), eq(orders.buyerProfileId, ctx.buyer.id)))
      .limit(1);
    if (!original) throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
    if (!original.deliveryZoneId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Zone de livraison inconnue' });
    }
    const items = await ctx.db
      .select({ listingId: orderItems.listingId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, original.id));

    const result = await createOrders(
      ctx.db,
      ctx.buyer,
      {
        items: items.map((i) => ({ listingId: i.listingId, quantity: Number(i.quantity) })),
        zoneByFarm: { [original.sellerFarmId]: original.deliveryZoneId },
        paymentMethod:
          input.paymentMethod ?? (original.paymentMethod as 'cod' | 'wave' | 'orange_money'),
        deliveryAddress: original.deliveryAddress,
        deliveryCity: original.deliveryCity ?? undefined,
        deliveryRegion: original.deliveryRegion ?? undefined,
        deliveryPhone: original.deliveryPhone ?? ctx.buyer.phone,
        deliveryNotes: original.deliveryNotes ?? undefined,
      },
      { reordered_from: original.orderNumber },
    );
    return {
      checkoutRef: result.checkoutRef,
      orders: result.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        paymentMethod: o.paymentMethod,
      })),
    };
  }),

  /** Orders paid together in a single checkout (success page). */
  getCheckout: buyerProcedure
    .input(z.object({ checkoutRef: z.string().min(1).max(64) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.orders.findMany({
        where: (o, { and: a, eq: e, sql: s }) =>
          a(
            e(o.buyerProfileId, ctx.buyer.id),
            s`${o.data}->>'checkout_ref' = ${input.checkoutRef}`,
          ),
        columns: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          paymentMethod: true,
          paymentStatus: true,
          status: true,
        },
      });
      return rows;
    }),

  /** Persisted cart (logged-in buyers); anonymous carts live in localStorage. */
  getCart: buyerProcedure.query(({ ctx }) => (ctx.buyer.data as BuyerData)?.cart ?? []),

  saveCart: buyerProcedure.input(saveCartSchema).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(buyerProfiles)
      .set({
        data: { ...((ctx.buyer.data as BuyerData) ?? {}), cart: input.items },
        updatedAt: new Date(),
      })
      .where(eq(buyerProfiles.id, ctx.buyer.id));
    return input.items;
  }),

  /** Unread order status notifications for the storefront header badge. */
  unreadUpdates: buyerProcedure.query(async ({ ctx }) => {
    const [{ value }] = await ctx.db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id),
          eq(notifications.type, 'order_status_change'),
          eq(notifications.read, false),
        ),
      );
    return Number(value);
  }),
});
