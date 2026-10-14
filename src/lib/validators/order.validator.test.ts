import { describe, expect, it } from 'vitest';
import {
  canCancelOrder,
  canTransition,
  computeOrderTotals,
  createOrderSchema,
  generateOrderNumber,
  groupByFarm,
  nextSellerAction,
  resolveUnitPrice,
} from './order.validator';
import {
  parseCatalogueParams,
  registerBuyerSchema,
  upsertListingSchema,
} from './storefront.validator';

const FARM = '11111111-1111-4111-8111-111111111111';
const ZONE = '22222222-2222-4222-8222-222222222222';
const LISTING = '33333333-3333-4333-8333-333333333333';

// Tomate: 500 detail, 400 superette (min 10kg), 350 grande surface (min 100kg)
const tomatoTiers = [
  { buyerType: 'particulier', price: '500', minQuantity: '1', maxQuantity: null },
  { buyerType: 'superette', price: '400', minQuantity: '10', maxQuantity: null },
  { buyerType: 'grande_surface', price: '350', minQuantity: '100', maxQuantity: null },
];

describe('resolveUnitPrice', () => {
  it('anonymous visitors pay the detail price', () => {
    expect(resolveUnitPrice('500', tomatoTiers, null, 50)).toEqual({
      price: 500,
      appliedTier: 'particulier',
    });
  });

  it('superette gets semi-gros price above its minimum quantity', () => {
    expect(resolveUnitPrice('500', tomatoTiers, 'superette', 50).price).toBe(400);
  });

  it('superette below the minimum falls back to the detail price', () => {
    expect(resolveUnitPrice('500', tomatoTiers, 'superette', 5)).toEqual({
      price: 500,
      appliedTier: 'particulier',
    });
  });

  it('grande surface falls back to the superette tier below 100kg', () => {
    expect(resolveUnitPrice('500', tomatoTiers, 'grande_surface', 50)).toEqual({
      price: 400,
      appliedTier: 'superette',
    });
    expect(resolveUnitPrice('500', tomatoTiers, 'grande_surface', 100).price).toBe(350);
  });

  it('respects max quantity brackets', () => {
    const tiers = [{ buyerType: 'superette', price: '400', minQuantity: '10', maxQuantity: '50' }];
    expect(resolveUnitPrice('500', tiers, 'superette', 60)).toEqual({
      price: 500,
      appliedTier: 'base',
    });
  });

  it('uses base price when a listing has no tiers', () => {
    expect(resolveUnitPrice('750', [], 'grande_surface', 1000)).toEqual({
      price: 750,
      appliedTier: 'base',
    });
  });
});

describe('computeOrderTotals', () => {
  it('sums lines and adds delivery fee', () => {
    expect(
      computeOrderTotals(
        [
          { quantity: 50, unitPrice: 400 },
          { quantity: 2.5, unitPrice: 300 },
        ],
        1500,
      ),
    ).toEqual({ subtotal: 20750, deliveryFee: 1500, total: 22250 });
  });

  it('rounds to 2 decimals', () => {
    expect(computeOrderTotals([{ quantity: 0.333, unitPrice: 100 }], 0).subtotal).toBe(33.3);
  });
});

describe('order workflow', () => {
  it('follows pending → confirmed → preparing → shipped → delivered', () => {
    expect(nextSellerAction('pending')).toBe('confirm');
    expect(nextSellerAction('confirmed')).toBe('prepare');
    expect(nextSellerAction('preparing')).toBe('ship');
    expect(nextSellerAction('shipped')).toBe('deliver');
    expect(nextSellerAction('delivered')).toBeNull();
    expect(nextSellerAction('cancelled')).toBeNull();
  });

  it('rejects skipping steps', () => {
    expect(canTransition('ship', 'pending')).toBe(false);
    expect(canTransition('ship', 'preparing')).toBe(true);
  });
});

describe('canCancelOrder', () => {
  const now = new Date('2026-10-14T12:00:00Z');

  it('allows cancelling a pending order within 30 minutes', () => {
    expect(canCancelOrder({ status: 'pending', createdAt: '2026-10-14T11:45:00Z' }, now)).toBe(
      true,
    );
  });

  it('refuses after 30 minutes', () => {
    expect(canCancelOrder({ status: 'pending', createdAt: '2026-10-14T11:29:00Z' }, now)).toBe(
      false,
    );
  });

  it('refuses once the seller confirmed', () => {
    expect(canCancelOrder({ status: 'confirmed', createdAt: '2026-10-14T11:59:00Z' }, now)).toBe(
      false,
    );
  });
});

describe('helpers', () => {
  it('generates CMD-YYYY-NNNNNN order numbers within 20 chars', () => {
    const n = generateOrderNumber(2026, 1234);
    expect(n).toBe('CMD-2026-001234');
    expect(n.length).toBeLessThanOrEqual(20);
  });

  it('groups cart lines by farm', () => {
    const groups = groupByFarm([
      { farmId: 'a', id: 1 },
      { farmId: 'b', id: 2 },
      { farmId: 'a', id: 3 },
    ]);
    expect(groups.get('a')?.map((l) => l.id)).toEqual([1, 3]);
    expect(groups.size).toBe(2);
  });
});

describe('createOrderSchema', () => {
  const valid = {
    items: [{ listingId: LISTING, quantity: 50 }],
    zoneByFarm: { [FARM]: ZONE },
    paymentMethod: 'cod',
    deliveryAddress: 'Rue 10, Médina, Dakar',
    deliveryPhone: '771234567',
  };

  it('accepts a COD order', () => {
    expect(createOrderSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty cart', () => {
    expect(createOrderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });

  it('rejects zero quantities and unknown payment methods', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, items: [{ listingId: LISTING, quantity: 0 }] })
        .success,
    ).toBe(false);
    expect(createOrderSchema.safeParse({ ...valid, paymentMethod: 'cheque' }).success).toBe(false);
  });
});

describe('upsertListingSchema', () => {
  const base = {
    name: 'Tomates',
    category: 'legumes',
    stockAvailable: 500,
    tiers: [
      { buyerType: 'particulier', price: 500 },
      { buyerType: 'superette', price: 400, minQuantity: 10 },
      { buyerType: 'grande_surface', price: 350, minQuantity: 100 },
    ],
  };

  it('accepts a 3-level price grid', () => {
    expect(upsertListingSchema.safeParse(base).success).toBe(true);
  });

  it('requires the detail price', () => {
    expect(upsertListingSchema.safeParse({ ...base, tiers: base.tiers.slice(1) }).success).toBe(
      false,
    );
  });

  it('rejects wholesale prices above detail', () => {
    const tiers = [
      { buyerType: 'particulier', price: 500 },
      { buyerType: 'superette', price: 600 },
    ];
    expect(upsertListingSchema.safeParse({ ...base, tiers }).success).toBe(false);
  });
});

describe('registerBuyerSchema', () => {
  const base = {
    contactName: 'Awa Ndiaye',
    phone: '77 123 45 67',
    email: 'awa@example.sn',
    password: 'secret1',
    buyerType: 'particulier',
    address: 'Sicap Liberté 6, Dakar',
  };

  it('accepts a particulier without company', () => {
    expect(registerBuyerSchema.safeParse(base).success).toBe(true);
  });

  it('requires company name for superettes and NINEA for grandes surfaces', () => {
    expect(registerBuyerSchema.safeParse({ ...base, buyerType: 'superette' }).success).toBe(false);
    expect(
      registerBuyerSchema.safeParse({ ...base, buyerType: 'grande_surface', companyName: 'Auchan' })
        .success,
    ).toBe(false);
    expect(
      registerBuyerSchema.safeParse({
        ...base,
        buyerType: 'grande_surface',
        companyName: 'Auchan',
        ninea: '005678901',
      }).success,
    ).toBe(true);
  });

  it('rejects non-Senegalese phone numbers', () => {
    expect(registerBuyerSchema.safeParse({ ...base, phone: '0612345678' }).success).toBe(false);
  });
});

describe('parseCatalogueParams', () => {
  it('maps French URL params and drops invalid values', () => {
    const parsed = parseCatalogueParams({
      q: 'tomate',
      categorie: 'legumes',
      prix_max: '600',
      bio: '1',
      tri: 'n_importe_quoi',
      page: '2',
    });
    expect(parsed).toMatchObject({
      search: 'tomate',
      category: 'legumes',
      maxPrice: 600,
      bio: true,
      sort: 'relevance',
      page: 2,
    });
  });
});
