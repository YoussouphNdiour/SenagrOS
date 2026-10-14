import { TRPCError } from '@trpc/server';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import {
  initiatePaymentSchema,
  paymentStatusQuerySchema,
  simulatePaymentSchema,
} from '@/lib/validators/payment.validator';
import { orders } from '../db/schema';
import {
  applyPaymentResult,
  initiateOrangeMoneyPayment,
  initiateWavePayment,
  isSimulationMode,
} from '../services/payment.service';
import { buyerProcedure, router } from '../trpc';

/**
 * Mobile-money payments. Provider callbacks are Next route handlers
 * (POST /api/webhooks/wave and /api/webhooks/orange-money) because signature
 * verification needs the raw request body.
 */
export const paymentRouter = router({
  initiateWave: buyerProcedure.input(initiatePaymentSchema).mutation(async ({ ctx, input }) => {
    const { list, checkoutRef } = await payableOrders(ctx, input.orderIds);
    return initiateWavePayment(ctx.db, list, checkoutRef);
  }),

  initiateOrangeMoney: buyerProcedure
    .input(initiatePaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const { list, checkoutRef } = await payableOrders(ctx, input.orderIds);
      return initiateOrangeMoneyPayment(ctx.db, list, checkoutRef);
    }),

  getPaymentStatus: buyerProcedure.input(paymentStatusQuerySchema).query(async ({ ctx, input }) => {
    const [order] = await ctx.db
      .select({
        id: orders.id,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        paymentReference: orders.paymentReference,
      })
      .from(orders)
      .where(and(eq(orders.id, input.orderId), eq(orders.buyerProfileId, ctx.buyer.id)))
      .limit(1);
    if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
    return order;
  }),

  /** Dev/sandbox only: completes a simulated payment when no provider credentials are set. */
  simulate: buyerProcedure.input(simulatePaymentSchema).mutation(async ({ ctx, input }) => {
    const owned = await ctx.db.query.orders.findFirst({
      where: (o, { and: a, eq: e, sql: s }) =>
        a(e(o.buyerProfileId, ctx.buyer.id), s`${o.data}->>'checkout_ref' = ${input.checkoutRef}`),
      columns: { paymentMethod: true },
    });
    if (!owned) throw new TRPCError({ code: 'NOT_FOUND', message: 'Paiement introuvable' });
    const provider = owned.paymentMethod === 'orange_money' ? 'orange_money' : 'wave';
    if (!isSimulationMode(provider)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Simulation désactivée' });
    }
    const updated = await applyPaymentResult(
      ctx.db,
      input.checkoutRef,
      input.outcome,
      `SIM-${Date.now()}`,
    );
    return { updated };
  }),
});

/**
 * Resolves the checkout of the requested orders and returns all of its unpaid,
 * non-cancelled orders: the provider is charged for exactly the set of orders
 * the webhook will mark as paid.
 */
async function payableOrders(
  ctx: { db: typeof import('../db').db; buyer: { id: string } },
  orderIds: string[],
) {
  const requested = await ctx.db
    .select({ data: orders.data })
    .from(orders)
    .where(and(inArray(orders.id, orderIds), eq(orders.buyerProfileId, ctx.buyer.id)));
  if (requested.length !== orderIds.length) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
  }
  const refs = new Set(requested.map((o) => o.data?.checkout_ref));
  const [checkoutRef] = [...refs];
  if (refs.size !== 1 || !checkoutRef) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Commandes de paniers différents' });
  }
  const list = await ctx.db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.buyerProfileId, ctx.buyer.id),
        sql`${orders.data}->>'checkout_ref' = ${checkoutRef}`,
        ne(orders.status, 'cancelled'),
        ne(orders.paymentStatus, 'paid'),
      ),
    );
  if (list.length === 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Commande déjà payée ou annulée' });
  }
  return { list, checkoutRef };
}
