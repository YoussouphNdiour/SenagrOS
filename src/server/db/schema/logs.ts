import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { postgisGeometry } from './postgis';
import { logTypeEnum } from './enums';
import { farms } from './farms';
import { assets } from './assets';
import { quantities } from './quantities';
import { planLogs } from './plans';

export const logs = pgTable(
  'logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: logTypeEnum('type').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    farmId: uuid('farm_id')
      .references(() => farms.id)
      .notNull(),
    notes: text('notes'),
    data: jsonb('data').default({}),
    flags: jsonb('flags').default([]),
    isMovement: boolean('is_movement').default(false),
    equipmentIds: jsonb('equipment_ids').default([]),
    locationIds: jsonb('location_ids').default([]),
    workerIds: jsonb('worker_ids').default([]),
    geometry: postgisGeometry('geometry'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('logs_type_timestamp_idx').on(table.type, table.timestamp),
  ],
);

export const logsRelations = relations(logs, ({ one, many }) => ({
  farm: one(farms, {
    fields: [logs.farmId],
    references: [farms.id],
  }),
  logAssets: many(logAssets),
  quantities: many(quantities),
  planLogs: many(planLogs),
}));

export const logAssets = pgTable(
  'log_assets',
  {
    logId: uuid('log_id')
      .references(() => logs.id)
      .notNull(),
    assetId: uuid('asset_id')
      .references(() => assets.id)
      .notNull(),
    role: varchar('role', { length: 20 }).default('subject'),
  },
  (table) => [primaryKey({ columns: [table.logId, table.assetId] })],
);

export const logAssetsRelations = relations(logAssets, ({ one }) => ({
  log: one(logs, {
    fields: [logAssets.logId],
    references: [logs.id],
  }),
  asset: one(assets, {
    fields: [logAssets.assetId],
    references: [assets.id],
  }),
}));
