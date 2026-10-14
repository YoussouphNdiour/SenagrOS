import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { assets } from './assets';
import { farms } from './farms';
import { marketplaceProducts } from './marketplace';
import { users } from './users';

// --- Buyer profiles (public storefront customers) ---

export const buyerProfiles = pgTable(
  'buyer_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    buyerType: varchar('buyer_type', { length: 30 }).notNull(), // particulier | superette | grande_surface
    companyName: varchar('company_name', { length: 255 }),
    contactName: varchar('contact_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 30 }).notNull(),
    email: varchar('email', { length: 255 }),
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }),
    region: varchar('region', { length: 100 }),
    ninea: varchar('ninea', { length: 20 }),
    paymentPreference: varchar('payment_preference', { length: 30 }).default('cod'), // cod | wave | orange_money | bank_transfer
    data: jsonb('data').default({}), // { cart: [{ listingId, quantity }] }
    isVerified: boolean('is_verified').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('buyer_profiles_user_id_idx').on(table.userId),
    index('buyer_profiles_buyer_type_idx').on(table.buyerType),
    index('buyer_profiles_region_idx').on(table.region),
  ],
);

// --- Product listings (public catalogue) ---

export const productListings = pgTable(
  'product_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .references(() => farms.id)
      .notNull(),
    sellerId: uuid('seller_id')
      .references(() => users.id)
      .notNull(),
    assetId: uuid('asset_id').references(() => assets.id),
    marketplaceProductId: uuid('marketplace_product_id'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }).notNull(), // cereales | legumes | fruits | tubercules | oleagineux | produits_transformes | autres
    subcategory: varchar('subcategory', { length: 100 }),
    photos: jsonb('photos').$type<{ url: string; alt?: string; order?: number }[]>().default([]),
    basePrice: decimal('base_price', { precision: 15, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 20 }).default('kg'), // kg | tonne | piece | botte | caisse | sac
    minOrderQuantity: decimal('min_order_quantity', { precision: 15, scale: 2 }).default('1'),
    stockAvailable: decimal('stock_available', { precision: 15, scale: 2 }).notNull(),
    originRegion: varchar('origin_region', { length: 100 }),
    isBio: boolean('is_bio').default(false),
    certifications: jsonb('certifications').$type<string[]>().default([]),
    harvestDate: date('harvest_date'),
    shelfLifeDays: integer('shelf_life_days'),
    isPublished: boolean('is_published').default(true),
    data: jsonb('data').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    index('product_listings_farm_id_idx').on(table.farmId),
    index('product_listings_category_idx').on(table.category),
    index('product_listings_is_published_idx').on(table.isPublished),
    index('product_listings_origin_region_idx').on(table.originRegion),
    // explicit name: the generated one exceeds Postgres' 63-char identifier limit
    foreignKey({
      name: 'product_listings_marketplace_product_fk',
      columns: [table.marketplaceProductId],
      foreignColumns: [marketplaceProducts.id],
    }),
  ],
);

// --- Price tiers (one price per buyer type per listing) ---

export const priceTiers = pgTable(
  'price_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .references(() => productListings.id, { onDelete: 'cascade' })
      .notNull(),
    buyerType: varchar('buyer_type', { length: 30 }).notNull(),
    price: decimal('price', { precision: 15, scale: 2 }).notNull(),
    minQuantity: decimal('min_quantity', { precision: 15, scale: 2 }).default('1'),
    maxQuantity: decimal('max_quantity', { precision: 15, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('price_tiers_listing_buyer_type_uniq').on(table.listingId, table.buyerType),
  ],
);

// --- Delivery zones (per farm) ---

export const deliveryZones = pgTable(
  'delivery_zones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .references(() => farms.id)
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    region: varchar('region', { length: 100 }).notNull(),
    department: varchar('department', { length: 100 }),
    deliveryFee: decimal('delivery_fee', { precision: 15, scale: 2 }).notNull().default('0'),
    minOrderAmount: decimal('min_order_amount', { precision: 15, scale: 2 }).default('0'),
    estimatedDays: integer('estimated_days').default(1),
    isActive: boolean('is_active').default(true),
    data: jsonb('data').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('delivery_zones_farm_id_idx').on(table.farmId),
    index('delivery_zones_region_idx').on(table.region),
  ],
);

// --- Orders ---

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
    buyerProfileId: uuid('buyer_profile_id')
      .references(() => buyerProfiles.id)
      .notNull(),
    sellerFarmId: uuid('seller_farm_id')
      .references(() => farms.id)
      .notNull(),
    deliveryZoneId: uuid('delivery_zone_id').references(() => deliveryZones.id),
    status: varchar('status', { length: 30 }).default('pending').notNull(), // pending | confirmed | preparing | shipped | delivered | cancelled | refunded
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
    deliveryFee: decimal('delivery_fee', { precision: 15, scale: 2 }).default('0'),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 30 }).notNull(), // cod | wave | orange_money
    paymentStatus: varchar('payment_status', { length: 20 }).default('pending'), // pending | paid | failed | refunded
    paymentReference: varchar('payment_reference', { length: 255 }),
    deliveryAddress: text('delivery_address').notNull(),
    deliveryCity: varchar('delivery_city', { length: 100 }),
    deliveryRegion: varchar('delivery_region', { length: 100 }),
    deliveryPhone: varchar('delivery_phone', { length: 30 }),
    deliveryNotes: text('delivery_notes'),
    estimatedDelivery: date('estimated_delivery'),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    notes: text('notes'),
    data: jsonb('data').$type<OrderData>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('orders_buyer_profile_id_idx').on(table.buyerProfileId),
    index('orders_seller_farm_id_idx').on(table.sellerFarmId),
    index('orders_status_idx').on(table.status),
    index('orders_payment_status_idx').on(table.paymentStatus),
    index('orders_order_number_idx').on(table.orderNumber),
  ],
);

export interface OrderData {
  checkout_ref?: string; // groups orders paid together (one checkout = one order per farm)
  preparing_at?: string;
  payment_provider_id?: string; // Wave checkout session id / OM pay_token
  om_notif_token?: string;
  paid_at?: string;
  reordered_from?: string;
}

// --- Order items (price snapshot) ---

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .references(() => orders.id, { onDelete: 'cascade' })
      .notNull(),
    listingId: uuid('listing_id')
      .references(() => productListings.id)
      .notNull(),
    productName: varchar('product_name', { length: 255 }).notNull(),
    quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 20 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 15, scale: 2 }).notNull(),
    data: jsonb('data').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_listing_id_idx').on(table.listingId),
  ],
);

// --- Reviews ---

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .references(() => productListings.id, { onDelete: 'cascade' })
      .notNull(),
    orderId: uuid('order_id')
      .references(() => orders.id)
      .notNull(),
    buyerProfileId: uuid('buyer_profile_id')
      .references(() => buyerProfiles.id)
      .notNull(),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    sellerResponse: text('seller_response'),
    isVisible: boolean('is_visible').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('reviews_order_listing_uniq').on(table.orderId, table.listingId),
    index('reviews_listing_id_idx').on(table.listingId),
    index('reviews_buyer_profile_id_idx').on(table.buyerProfileId),
    index('reviews_rating_idx').on(table.rating),
    check('reviews_rating_range', sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

// --- Relations ---

export const buyerProfilesRelations = relations(buyerProfiles, ({ one, many }) => ({
  user: one(users, { fields: [buyerProfiles.userId], references: [users.id] }),
  orders: many(orders),
  reviews: many(reviews),
}));

export const productListingsRelations = relations(productListings, ({ one, many }) => ({
  farm: one(farms, { fields: [productListings.farmId], references: [farms.id] }),
  seller: one(users, { fields: [productListings.sellerId], references: [users.id] }),
  priceTiers: many(priceTiers),
  orderItems: many(orderItems),
  reviews: many(reviews),
}));

export const priceTiersRelations = relations(priceTiers, ({ one }) => ({
  listing: one(productListings, {
    fields: [priceTiers.listingId],
    references: [productListings.id],
  }),
}));

export const deliveryZonesRelations = relations(deliveryZones, ({ one, many }) => ({
  farm: one(farms, { fields: [deliveryZones.farmId], references: [farms.id] }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyerProfile: one(buyerProfiles, {
    fields: [orders.buyerProfileId],
    references: [buyerProfiles.id],
  }),
  sellerFarm: one(farms, { fields: [orders.sellerFarmId], references: [farms.id] }),
  deliveryZone: one(deliveryZones, {
    fields: [orders.deliveryZoneId],
    references: [deliveryZones.id],
  }),
  items: many(orderItems),
  reviews: many(reviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  listing: one(productListings, {
    fields: [orderItems.listingId],
    references: [productListings.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  listing: one(productListings, { fields: [reviews.listingId], references: [productListings.id] }),
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
  buyerProfile: one(buyerProfiles, {
    fields: [reviews.buyerProfileId],
    references: [buyerProfiles.id],
  }),
}));
