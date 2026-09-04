import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  bigint,
} from 'drizzle-orm/pg-core';
import { inventoryAdjustmentEnum } from './enums';
import { logs } from './logs';
import { assets } from './assets';

export const quantities = pgTable('quantities', {
  id: uuid('id').primaryKey().defaultRandom(),
  logId: uuid('log_id')
    .references(() => logs.id, { onDelete: 'cascade' })
    .notNull(),
  measure: varchar('measure', { length: 20 }).notNull(),
  numerator: bigint('numerator', { mode: 'number' }).notNull(),
  denominator: bigint('denominator', { mode: 'number' }).default(1),
  unit: varchar('unit', { length: 20 }).notNull(),
  label: varchar('label', { length: 100 }),
  inventoryAdjustment: inventoryAdjustmentEnum('inventory_adjustment'),
  inventoryAssetId: uuid('inventory_asset_id').references(() => assets.id),
});

export const quantitiesRelations = relations(quantities, ({ one }) => ({
  log: one(logs, {
    fields: [quantities.logId],
    references: [logs.id],
  }),
  inventoryAsset: one(assets, {
    fields: [quantities.inventoryAssetId],
    references: [assets.id],
  }),
}));
