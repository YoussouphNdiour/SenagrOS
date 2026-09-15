import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { crops } from './crops';

export const cropVarieties = pgTable('crop_varieties', {
  id: uuid('id').primaryKey().defaultRandom(),
  cropId: uuid('crop_id')
    .references(() => crops.id)
    .notNull(),
  code: varchar('code', { length: 30 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  cycleDays: integer('cycle_days'),
  yieldPotentialKgHa: integer('yield_potential_kg_ha'),
  characteristics: jsonb('characteristics').default({}),
  origin: varchar('origin', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cropVarietiesRelations = relations(cropVarieties, ({ one }) => ({
  crop: one(crops, {
    fields: [cropVarieties.cropId],
    references: [crops.id],
  }),
}));
