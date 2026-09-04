import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
} from 'drizzle-orm/pg-core';
import { assets } from './assets';
import { logs } from './logs';
import { farms } from './farms';

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id')
    .references(() => assets.id)
    .notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  logId: uuid('log_id').references(() => logs.id),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const inventoryRelations = relations(inventory, ({ one }) => ({
  asset: one(assets, {
    fields: [inventory.assetId],
    references: [assets.id],
  }),
  log: one(logs, {
    fields: [inventory.logId],
    references: [logs.id],
  }),
  farm: one(farms, {
    fields: [inventory.farmId],
    references: [farms.id],
  }),
}));
