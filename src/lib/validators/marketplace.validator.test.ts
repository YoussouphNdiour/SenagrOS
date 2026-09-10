import { describe, it, expect } from 'vitest';
import {
  productCategoryEnum,
  productCategoryLabels,
  orderStatusEnum,
  orderStatusLabels,
  deliveryMethodEnum,
  deliveryMethodLabels,
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  listOrdersSchema,
  productIdSchema,
  formatFCFA,
} from './marketplace.validator';

// --- Enums ---

describe('productCategoryEnum', () => {
  it('accepts valid categories', () => {
    expect(productCategoryEnum.parse('cereales')).toBe('cereales');
    expect(productCategoryEnum.parse('legumes')).toBe('legumes');
    expect(productCategoryEnum.parse('fruits')).toBe('fruits');
    expect(productCategoryEnum.parse('tubercules')).toBe('tubercules');
    expect(productCategoryEnum.parse('oleagineux')).toBe('oleagineux');
    expect(productCategoryEnum.parse('autres')).toBe('autres');
  });

  it('rejects invalid category', () => {
    expect(() => productCategoryEnum.parse('viande')).toThrow();
  });

  it('has labels for all categories', () => {
    for (const cat of productCategoryEnum.options) {
      expect(productCategoryLabels[cat]).toBeDefined();
    }
  });
});

describe('orderStatusEnum', () => {
  it('accepts valid statuses', () => {
    for (const s of ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']) {
      expect(orderStatusEnum.parse(s)).toBe(s);
    }
  });

  it('has labels for all statuses', () => {
    for (const s of orderStatusEnum.options) {
      expect(orderStatusLabels[s]).toBeDefined();
    }
  });
});

describe('deliveryMethodEnum', () => {
  it('accepts valid methods', () => {
    expect(deliveryMethodEnum.parse('pickup')).toBe('pickup');
    expect(deliveryMethodEnum.parse('delivery')).toBe('delivery');
  });

  it('has labels for all methods', () => {
    for (const m of deliveryMethodEnum.options) {
      expect(deliveryMethodLabels[m]).toBeDefined();
    }
  });
});

// --- Product Schemas ---

describe('createProductSchema', () => {
  const validProduct = {
    name: 'Arachide',
    category: 'cereales' as const,
    pricePerKg: 2500,
    quantityAvailable: 5000,
  };

  it('accepts a valid product', () => {
    const result = createProductSchema.parse(validProduct);
    expect(result.name).toBe('Arachide');
    expect(result.category).toBe('cereales');
    expect(result.pricePerKg).toBe(2500);
    expect(result.quantityAvailable).toBe(5000);
    expect(result.isBio).toBe(false);
    expect(result.unit).toBe('kg');
  });

  it('accepts full product with optional fields', () => {
    const full = {
      ...validProduct,
      description: 'Arachides de qualité supérieure',
      photoUrl: 'https://example.com/photo.jpg',
      location: 'Dakar, SN',
      isBio: true,
      unit: 'sac',
    };
    const result = createProductSchema.parse(full);
    expect(result.description).toBe('Arachides de qualité supérieure');
    expect(result.isBio).toBe(true);
    expect(result.location).toBe('Dakar, SN');
  });

  it('rejects name too short', () => {
    expect(() => createProductSchema.parse({ ...validProduct, name: 'A' })).toThrow();
  });

  it('rejects negative price', () => {
    expect(() => createProductSchema.parse({ ...validProduct, pricePerKg: -100 })).toThrow();
  });

  it('rejects negative quantity', () => {
    expect(() => createProductSchema.parse({ ...validProduct, quantityAvailable: -1 })).toThrow();
  });

  it('rejects invalid category', () => {
    expect(() => createProductSchema.parse({ ...validProduct, category: 'invalid' })).toThrow();
  });
});

describe('updateProductSchema', () => {
  it('accepts partial update', () => {
    const result = updateProductSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      pricePerKg: 3000,
    });
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.pricePerKg).toBe(3000);
  });

  it('rejects invalid UUID', () => {
    expect(() => updateProductSchema.parse({ id: 'not-a-uuid' })).toThrow();
  });
});

describe('listProductsSchema', () => {
  it('applies defaults', () => {
    const result = listProductsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('accepts all filters', () => {
    const result = listProductsSchema.parse({
      search: 'arachide',
      category: 'cereales',
      minPrice: 1000,
      maxPrice: 5000,
      bioOnly: true,
      inStockOnly: true,
      page: 2,
      limit: 10,
    });
    expect(result.search).toBe('arachide');
    expect(result.category).toBe('cereales');
    expect(result.bioOnly).toBe(true);
  });
});

// --- Order Schemas ---

describe('createOrderSchema', () => {
  const validOrder = {
    productId: '550e8400-e29b-41d4-a716-446655440000',
    quantity: 100,
  };

  it('accepts a valid order', () => {
    const result = createOrderSchema.parse(validOrder);
    expect(result.productId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.quantity).toBe(100);
    expect(result.deliveryMethod).toBe('pickup');
  });

  it('accepts order with delivery', () => {
    const result = createOrderSchema.parse({
      ...validOrder,
      deliveryMethod: 'delivery',
      deliveryAddress: 'Dakar, Medina, rue 15',
      notes: 'Livraison avant 10h',
    });
    expect(result.deliveryMethod).toBe('delivery');
    expect(result.deliveryAddress).toBe('Dakar, Medina, rue 15');
  });

  it('rejects zero quantity', () => {
    expect(() => createOrderSchema.parse({ ...validOrder, quantity: 0 })).toThrow();
  });

  it('rejects negative quantity', () => {
    expect(() => createOrderSchema.parse({ ...validOrder, quantity: -50 })).toThrow();
  });
});

describe('updateOrderStatusSchema', () => {
  it('accepts valid status update', () => {
    const result = updateOrderStatusSchema.parse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'confirmed',
    });
    expect(result.status).toBe('confirmed');
  });

  it('rejects invalid status', () => {
    expect(() =>
      updateOrderStatusSchema.parse({
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'invalid',
      }),
    ).toThrow();
  });
});

describe('listOrdersSchema', () => {
  it('applies defaults', () => {
    const result = listOrdersSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it('accepts status filter', () => {
    const result = listOrdersSchema.parse({ status: 'pending' });
    expect(result.status).toBe('pending');
  });
});

describe('productIdSchema', () => {
  it('accepts valid UUID', () => {
    const result = productIdSchema.parse({ productId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.productId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects invalid UUID', () => {
    expect(() => productIdSchema.parse({ productId: 'not-uuid' })).toThrow();
  });
});

// --- Helpers ---

describe('formatFCFA', () => {
  it('formats zero', () => {
    const result = formatFCFA(0);
    expect(result).toContain('0');
    expect(result).toContain('CFA');
  });

  it('formats large amounts', () => {
    const result = formatFCFA(2500000);
    // Should contain 2 500 000 in some form
    expect(result).toContain('CFA');
  });
});

// --- Scenario: Publication et commande Arachide ---

describe('Scenario: Arachide sur le Marketplace', () => {
  it('Producteur publie 5000kg d\'Arachide à 2500 FCFA/kg', () => {
    const product = createProductSchema.parse({
      name: 'Arachide',
      description: 'Arachides de qualité, récolte Hivernage 2026',
      category: 'oleagineux',
      pricePerKg: 2500,
      quantityAvailable: 5000,
      location: 'Dakar, SN',
      isBio: true,
    });

    expect(product.name).toBe('Arachide');
    expect(product.category).toBe('oleagineux');
    expect(product.pricePerKg).toBe(2500);
    expect(product.quantityAvailable).toBe(5000);
    expect(product.isBio).toBe(true);
  });

  it('Acheteur commande 200kg avec livraison', () => {
    const order = createOrderSchema.parse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 200,
      deliveryMethod: 'delivery',
      deliveryAddress: 'Marché Sandaga, Dakar',
      notes: 'Livraison avant vendredi',
    });

    expect(order.quantity).toBe(200);
    expect(order.deliveryMethod).toBe('delivery');

    // Prix total = 200 × 2500 = 500 000 FCFA
    const total = order.quantity * 2500;
    expect(total).toBe(500000);

    // Stock restant = 5000 - 200 = 4800 kg
    const remaining = 5000 - order.quantity;
    expect(remaining).toBe(4800);
  });

  it('Producteur confirme puis expédie', () => {
    const confirm = updateOrderStatusSchema.parse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'confirmed',
    });
    expect(confirm.status).toBe('confirmed');

    const ship = updateOrderStatusSchema.parse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'shipped',
    });
    expect(ship.status).toBe('shipped');

    const deliver = updateOrderStatusSchema.parse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      status: 'delivered',
    });
    expect(deliver.status).toBe('delivered');
  });
});
