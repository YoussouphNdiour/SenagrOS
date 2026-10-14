import { z } from 'zod';
import type { BuyerType } from './storefront.validator';

// --- Enums ---

export const orderStatusEnum = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

export const orderStatusVariants: Record<
  OrderStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'default',
};

/** Happy-path order lifecycle, in order. Used for the tracking timeline. */
export const ORDER_FLOW = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'] as const;

/** Seller actions and the status transition each one performs. */
export const SELLER_TRANSITIONS = {
  confirm: { from: 'pending', to: 'confirmed' },
  prepare: { from: 'confirmed', to: 'preparing' },
  ship: { from: 'preparing', to: 'shipped' },
  deliver: { from: 'shipped', to: 'delivered' },
} as const satisfies Record<string, { from: OrderStatus; to: OrderStatus }>;
export type SellerAction = keyof typeof SELLER_TRANSITIONS;

export const sellerActionLabels: Record<SellerAction, string> = {
  confirm: 'Confirmer',
  prepare: 'Préparer',
  ship: 'Expédier',
  deliver: 'Livrer',
};

/** Returns the seller action available for a given status, if any. */
export function nextSellerAction(status: string): SellerAction | null {
  for (const [action, t] of Object.entries(SELLER_TRANSITIONS)) {
    if (t.from === status) return action as SellerAction;
  }
  return null;
}

export function canTransition(action: SellerAction, currentStatus: string): boolean {
  return SELLER_TRANSITIONS[action].from === currentStatus;
}

export const paymentMethodEnum = z.enum(['cod', 'wave', 'orange_money']);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cod: 'Paiement à la livraison',
  wave: 'Wave',
  orange_money: 'Orange Money',
};

export const paymentStatusEnum = z.enum(['pending', 'paid', 'failed', 'refunded']);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
  refunded: 'Remboursé',
};

// --- Cancellation rule ---

export const CANCEL_WINDOW_MINUTES = 30;

/** A buyer may cancel an order only while it is pending and within 30 minutes of creation. */
export function canCancelOrder(
  order: { status: string; createdAt: Date | string | null },
  now: Date = new Date(),
): boolean {
  if (order.status !== 'pending' || !order.createdAt) return false;
  const created = new Date(order.createdAt).getTime();
  return now.getTime() - created <= CANCEL_WINDOW_MINUTES * 60 * 1000;
}

// --- Pricing ---

export interface PriceTierLike {
  buyerType: string;
  price: string | number;
  minQuantity: string | number | null;
  maxQuantity: string | number | null;
}

/** Tier fallback order: a grande_surface buyer below its minimum gets the superette price, etc. */
const TIER_FALLBACK: Record<BuyerType, BuyerType[]> = {
  grande_surface: ['grande_surface', 'superette', 'particulier'],
  superette: ['superette', 'particulier'],
  particulier: ['particulier'],
};

function tierApplies(tier: PriceTierLike, quantity: number): boolean {
  const min = tier.minQuantity === null ? 0 : Number(tier.minQuantity);
  const max = tier.maxQuantity === null ? Number.POSITIVE_INFINITY : Number(tier.maxQuantity);
  return quantity >= min && quantity <= max;
}

/**
 * Resolves the unit price for a buyer profile and quantity.
 * Anonymous visitors (buyerType = null) and particuliers pay the base (detail) price
 * unless a particulier tier exists. Pro buyers fall back to cheaper-to-dearer tiers
 * whose quantity bracket matches.
 */
export function resolveUnitPrice(
  basePrice: string | number,
  tiers: PriceTierLike[],
  buyerType: BuyerType | null,
  quantity = 1,
): { price: number; appliedTier: BuyerType | 'base' } {
  const chain = TIER_FALLBACK[buyerType ?? 'particulier'];
  for (const type of chain) {
    const tier = tiers.find((t) => t.buyerType === type);
    if (tier && (type === 'particulier' || tierApplies(tier, quantity))) {
      return { price: Number(tier.price), appliedTier: type };
    }
  }
  return { price: Number(basePrice), appliedTier: 'base' };
}

/** Rounds to 2 decimals (FCFA amounts are stored as DECIMAL(15,2)). */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeOrderTotals(
  lines: { quantity: number; unitPrice: number }[],
  deliveryFee: number,
): { subtotal: number; deliveryFee: number; total: number } {
  const subtotal = roundMoney(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0));
  const fee = roundMoney(deliveryFee);
  return { subtotal, deliveryFee: fee, total: roundMoney(subtotal + fee) };
}

/** Order number format: CMD-YYYY-NNNNNN (max 20 chars). */
export function generateOrderNumber(year: number, sequence: number): string {
  return `CMD-${year}-${String(sequence).padStart(6, '0')}`;
}

/** Groups cart lines by seller farm: one order is created per farm. */
export function groupByFarm<T extends { farmId: string }>(lines: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const line of lines) {
    const group = groups.get(line.farmId) ?? [];
    group.push(line);
    groups.set(line.farmId, group);
  }
  return groups;
}

// --- Schemas ---

export const cartItemSchema = z.object({
  listingId: z.string().uuid(),
  quantity: z.number().positive('La quantité doit être positive'),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const deliveryInfoSchema = z.object({
  deliveryAddress: z.string().trim().min(5, 'Adresse trop courte'),
  deliveryCity: z.string().trim().max(100).optional(),
  deliveryRegion: z.string().trim().max(100).optional(),
  deliveryPhone: z.string().trim().min(7, 'Téléphone requis').max(30),
  deliveryNotes: z.string().max(1000).optional(),
});

export const createOrderSchema = deliveryInfoSchema.extend({
  items: z.array(cartItemSchema).min(1, 'Le panier est vide').max(50),
  /** farmId → deliveryZoneId: each farm defines its own zones */
  zoneByFarm: z.record(z.string().uuid(), z.string().uuid()),
  paymentMethod: paymentMethodEnum,
});
export type CreateOrderInput = z.input<typeof createOrderSchema>;

export const listMyOrdersSchema = z.object({
  status: orderStatusEnum.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

export const orderIdSchema = z.object({ id: z.string().uuid() });

export const cancelOrderSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const reorderSchema = z.object({
  id: z.string().uuid(),
  paymentMethod: paymentMethodEnum.optional(),
});

export const listReceivedOrdersSchema = z.object({
  status: orderStatusEnum.optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const sellerTransitionSchema = z.object({
  id: z.string().uuid(),
  /** For COD orders on delivery: the seller confirms cash was collected. */
  codPaid: z.boolean().optional(),
});

export const saveCartSchema = z.object({
  items: z.array(cartItemSchema).max(50),
});
