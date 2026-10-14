import { TRPCError } from '@trpc/server';
import { and, eq, gte, inArray, like, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { z } from 'zod';
import {
  type createOrderSchema,
  computeOrderTotals,
  generateOrderNumber,
  groupByFarm,
  orderStatusLabels,
  type OrderStatus,
  SELLER_TRANSITIONS,
  type SellerAction,
} from '@/lib/validators/order.validator';
import { type BuyerType, formatXof } from '@/lib/validators/storefront.validator';
import type { Database } from '../db';
import {
  buyerProfiles,
  deliveryZones,
  notifications,
  orderItems,
  orders,
  productListings,
  users,
} from '../db/schema';
import { quoteItems } from './storefront.service';

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
type DbOrTx = Database | Tx;
type BuyerProfile = typeof buyerProfiles.$inferSelect;
type CreateOrderParams = z.output<typeof createOrderSchema>;

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Next CMD-YYYY-NNNNNN number. Must run inside the transaction holding the order-number lock. */
async function nextOrderNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const [{ max }] = await tx
    .select({ max: sql<string | null>`max(${orders.orderNumber})` })
    .from(orders)
    .where(like(orders.orderNumber, `CMD-${year}-%`));
  const seq = max ? Number(max.split('-')[2]) + 1 : 1;
  return generateOrderNumber(year, seq);
}

async function sellerRecipients(db: DbOrTx, farmId: string) {
  return db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.farmId, farmId),
        inArray(users.role, ['owner', 'manager']),
        eq(users.isActive, true),
      ),
    );
}

export async function notifySellerNewOrder(
  db: DbOrTx,
  order: { id: string; orderNumber: string; sellerFarmId: string; totalAmount: string },
  buyerName: string,
) {
  const recipients = await sellerRecipients(db, order.sellerFarmId);
  if (recipients.length === 0) return;
  await db.insert(notifications).values(
    recipients.map((r) => ({
      farmId: order.sellerFarmId,
      userId: r.id,
      type: 'new_order',
      title: `Nouvelle commande ${order.orderNumber}`,
      message: `${buyerName} a passé une commande de ${formatXof(order.totalAmount)}.`,
      entityType: 'order',
      entityId: order.id,
    })),
  );
}

/** Buyer notifications are scoped to the seller farm (notifications.farm_id is required). */
export async function notifyBuyerStatusChange(
  db: DbOrTx,
  order: { id: string; orderNumber: string; sellerFarmId: string; buyerProfileId: string },
  buyerUserId: string,
  status: OrderStatus,
) {
  await db.insert(notifications).values({
    farmId: order.sellerFarmId,
    userId: buyerUserId,
    type: 'order_status_change',
    title: `Commande ${order.orderNumber} : ${orderStatusLabels[status]}`,
    message: `Le statut de votre commande ${order.orderNumber} est passé à « ${orderStatusLabels[status]} ».`,
    entityType: 'order',
    entityId: order.id,
  });
}

/**
 * Creates one order per seller farm from a cart: prices according to the buyer
 * profile, checks min quantities, zone minimums and stock, decrements stock
 * atomically and notifies the sellers. All orders share a checkout_ref so they
 * can be paid in one mobile-money transaction.
 */
export async function createOrders(
  db: Database,
  buyer: BuyerProfile,
  input: CreateOrderParams,
  extraData: Record<string, string> = {},
) {
  const { lines, unavailable } = await quoteItems(db, input.items, buyer.buyerType as BuyerType);
  if (unavailable.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Certains produits ne sont plus disponibles. Mettez votre panier à jour.',
    });
  }
  for (const line of lines) {
    if (line.quantity < line.minOrderQuantity) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `${line.name} : quantité minimum ${line.minOrderQuantity} ${line.unit}`,
      });
    }
    if (line.quantity > line.stockAvailable) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: `Stock insuffisant pour ${line.name} (disponible : ${line.stockAvailable} ${line.unit})`,
      });
    }
  }

  const groups = groupByFarm(lines);
  const farmIds = [...groups.keys()];
  const zoneIds = farmIds.map((f) => input.zoneByFarm[f]).filter(Boolean);
  const zones = zoneIds.length
    ? await db.select().from(deliveryZones).where(inArray(deliveryZones.id, zoneIds))
    : [];

  const checkoutRef = uuidv4().replace(/-/g, '').slice(0, 24);

  return db.transaction(async (tx) => {
    // Serialize order-number allocation
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('storefront_order_number'))`);

    const created = [];
    for (const [farmId, farmLines] of groups) {
      const zone = zones.find((z) => z.id === input.zoneByFarm[farmId]);
      if (!zone || zone.farmId !== farmId || !zone.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Choisissez une zone de livraison pour ${farmLines[0].farmName}`,
        });
      }
      const totals = computeOrderTotals(farmLines, Number(zone.deliveryFee));
      if (totals.subtotal < Number(zone.minOrderAmount ?? 0)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Commande minimum de ${formatXof(zone.minOrderAmount)} pour la zone ${zone.name} (${farmLines[0].farmName})`,
        });
      }

      for (const line of farmLines) {
        const updated = await tx
          .update(productListings)
          .set({
            stockAvailable: sql`${productListings.stockAvailable} - ${String(line.quantity)}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productListings.id, line.id),
              gte(productListings.stockAvailable, String(line.quantity)),
            ),
          )
          .returning({ id: productListings.id });
        if (updated.length === 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Stock insuffisant pour ${line.name}`,
          });
        }
      }

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: await nextOrderNumber(tx),
          buyerProfileId: buyer.id,
          sellerFarmId: farmId,
          deliveryZoneId: zone.id,
          status: 'pending',
          subtotal: String(totals.subtotal),
          deliveryFee: String(totals.deliveryFee),
          totalAmount: String(totals.total),
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          deliveryAddress: input.deliveryAddress,
          deliveryCity: input.deliveryCity,
          deliveryRegion: input.deliveryRegion ?? zone.region,
          deliveryPhone: input.deliveryPhone,
          deliveryNotes: input.deliveryNotes,
          estimatedDelivery: addDays(zone.estimatedDays ?? 1),
          data: { checkout_ref: checkoutRef, ...extraData },
        })
        .returning();

      await tx.insert(orderItems).values(
        farmLines.map((line) => ({
          orderId: order.id,
          listingId: line.id,
          productName: line.name,
          quantity: String(line.quantity),
          unit: line.unit ?? 'kg',
          unitPrice: String(line.unitPrice),
          totalPrice: String(line.lineTotal),
          data: { applied_tier: line.appliedTier },
        })),
      );

      await notifySellerNewOrder(tx, order, buyer.companyName || buyer.contactName);
      created.push(order);
    }
    return { orders: created, checkoutRef };
  });
}

/** Puts the stock of a cancelled order's items back. */
export async function restoreStock(tx: Tx, orderId: string) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    await tx
      .update(productListings)
      .set({
        stockAvailable: sql`${productListings.stockAvailable} + ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(productListings.id, item.listingId));
  }
}

/**
 * Applies a seller workflow action (pending → confirmed → preparing → shipped → delivered).
 * The status guard is in the WHERE clause so concurrent clicks cannot skip a step.
 */
export async function transitionOrder(
  db: Database,
  farmId: string,
  orderId: string,
  action: SellerAction,
  options: { codPaid?: boolean } = {},
) {
  const { from, to } = SELLER_TRANSITIONS[action];
  const now = new Date();
  const [current] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.sellerFarmId, farmId)))
    .limit(1);
  if (!current) throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable' });
  if (current.status !== from) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Action impossible : la commande est « ${orderStatusLabels[current.status as OrderStatus] ?? current.status} »`,
    });
  }

  const patch: Partial<typeof orders.$inferInsert> = { status: to, updatedAt: now };
  if (to === 'confirmed') patch.confirmedAt = now;
  if (to === 'preparing') patch.data = { ...(current.data ?? {}), preparing_at: now.toISOString() };
  if (to === 'shipped') patch.shippedAt = now;
  if (to === 'delivered') {
    patch.deliveredAt = now;
    if (current.paymentMethod === 'cod' && options.codPaid) {
      patch.paymentStatus = 'paid';
      patch.data = { ...(current.data ?? {}), paid_at: now.toISOString() };
    }
  }

  const [updated] = await db
    .update(orders)
    .set(patch)
    .where(and(eq(orders.id, orderId), eq(orders.status, from)))
    .returning();
  if (!updated) {
    throw new TRPCError({ code: 'CONFLICT', message: 'La commande a été modifiée entre-temps' });
  }

  const buyerUser = await buyerUserIdForOrder(db, updated.buyerProfileId);
  if (buyerUser) await notifyBuyerStatusChange(db, updated, buyerUser, to);
  return updated;
}

export async function buyerUserIdForOrder(db: DbOrTx, buyerProfileId: string) {
  const [row] = await db
    .select({ userId: buyerProfiles.userId })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.id, buyerProfileId))
    .limit(1);
  return row?.userId ?? null;
}
