import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { assetTypeEnum } from './enums';
import { farms } from './farms';
import { logAssets } from './logs';
import { inventory } from './inventory';
import { parcelCalendars } from './calendars';

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: assetTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  parentId: uuid('parent_id'),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  notes: text('notes'),
  data: jsonb('data').default({}),
  flags: jsonb('flags').default([]),
  isLocation: boolean('is_location').default(false),
  isFixed: boolean('is_fixed').default(false),
  idTags: jsonb('id_tags').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
});

export const assetsRelations = relations(assets, ({ one, many }) => ({
  farm: one(farms, {
    fields: [assets.farmId],
    references: [farms.id],
  }),
  parent: one(assets, {
    fields: [assets.parentId],
    references: [assets.id],
    relationName: 'assetParent',
  }),
  children: many(assets, { relationName: 'assetParent' }),
  logAssets: many(logAssets),
  inventory: many(inventory),
  parcelCalendars: many(parcelCalendars),
}));
