import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  decimal,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { farms } from './farms';
import { users } from './users';

// --- Marketplace Products (published listings) ---

export const marketplaceProducts = pgTable(
  'marketplace_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .references(() => farms.id)
      .notNull(),
    sellerId: uuid('seller_id')
      .references(() => users.id)
      .notNull(),
    assetId: uuid('asset_id'), // optional link to an asset type "product"
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }).notNull(), // cereales, legumes, fruits, tubercules, oleagineux, autres
    photoUrl: varchar('photo_url', { length: 500 }),
    pricePerKg: decimal('price_per_kg', { precision: 15, scale: 2 }).notNull(),
    quantityAvailable: decimal('quantity_available', { precision: 15, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 20 }).default('kg'),
    location: varchar('location', { length: 255 }), // e.g., "Dakar, SN"
    isBio: boolean('is_bio').default(false),
    isPublished: boolean('is_published').default(true),
    data: jsonb('data').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    index('marketplace_products_farm_id_idx').on(table.farmId),
    index('marketplace_products_category_idx').on(table.category),
    index('marketplace_products_is_published_idx').on(table.isPublished),
  ],
);

export const marketplaceProductsRelations = relations(marketplaceProducts, ({ one, many }) => ({
  farm: one(farms, {
    fields: [marketplaceProducts.farmId],
    references: [farms.id],
  }),
  seller: one(users, {
    fields: [marketplaceProducts.sellerId],
    references: [users.id],
  }),
  orders: many(marketplaceOrders),
}));

// --- Marketplace Orders ---

export const marketplaceOrders = pgTable(
  'marketplace_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .references(() => marketplaceProducts.id)
      .notNull(),
    buyerId: uuid('buyer_id')
      .references(() => users.id)
      .notNull(),
    buyerFarmId: uuid('buyer_farm_id')
      .references(() => farms.id)
      .notNull(),
    sellerFarmId: uuid('seller_farm_id')
      .references(() => farms.id)
      .notNull(),
    quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | confirmed | shipped | delivered | cancelled
    deliveryAddress: text('delivery_address'),
    deliveryMethod: varchar('delivery_method', { length: 30 }), // pickup | delivery
    notes: text('notes'),
    data: jsonb('data').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('marketplace_orders_product_id_idx').on(table.productId),
    index('marketplace_orders_buyer_id_idx').on(table.buyerId),
    index('marketplace_orders_seller_farm_id_idx').on(table.sellerFarmId),
    index('marketplace_orders_status_idx').on(table.status),
  ],
);

export const marketplaceOrdersRelations = relations(marketplaceOrders, ({ one }) => ({
  product: one(marketplaceProducts, {
    fields: [marketplaceOrders.productId],
    references: [marketplaceProducts.id],
  }),
  buyer: one(users, {
    fields: [marketplaceOrders.buyerId],
    references: [users.id],
  }),
  buyerFarm: one(farms, {
    fields: [marketplaceOrders.buyerFarmId],
    references: [farms.id],
    relationName: 'buyerFarmOrders',
  }),
  sellerFarm: one(farms, {
    fields: [marketplaceOrders.sellerFarmId],
    references: [farms.id],
    relationName: 'sellerFarmOrders',
  }),
}));
