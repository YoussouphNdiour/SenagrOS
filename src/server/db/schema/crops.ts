import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { cropFamilies } from './crop-families';
import { cropVarieties } from './crop-varieties';
import { cropRotationRules } from './crop-rotation-rules';

export const crops = pgTable('crops', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).unique().notNull(),
  nameFr: varchar('name_fr', { length: 100 }).notNull(),
  nameEn: varchar('name_en', { length: 100 }),
  nameWo: varchar('name_wo', { length: 100 }),
  familyId: uuid('family_id').references(() => cropFamilies.id),
  cycleShortDays: integer('cycle_short_days'),
  cycleLongDays: integer('cycle_long_days'),
  seasonPreference: jsonb('season_preference').default([]),
  data: jsonb('data').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cropsRelations = relations(crops, ({ one, many }) => ({
  family: one(cropFamilies, {
    fields: [crops.familyId],
    references: [cropFamilies.id],
  }),
  varieties: many(cropVarieties),
  rotationRulesAsPrevious: many(cropRotationRules, { relationName: 'previousCrop' }),
  rotationRulesAsNext: many(cropRotationRules, { relationName: 'nextCrop' }),
}));
