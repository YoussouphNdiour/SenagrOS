import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { rotationCompatibilityEnum } from './enums';
import { farms } from './farms';
import { crops } from './crops';

export const cropRotationRules = pgTable('crop_rotation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id').references(() => farms.id),
  previousCropId: uuid('previous_crop_id')
    .references(() => crops.id)
    .notNull(),
  nextCropId: uuid('next_crop_id')
    .references(() => crops.id)
    .notNull(),
  compatibility: rotationCompatibilityEnum('compatibility').notNull(),
  reason: text('reason'),
  minIntervalDays: integer('min_interval_days'),
  recommendation: text('recommendation'),
  data: jsonb('data').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cropRotationRulesRelations = relations(
  cropRotationRules,
  ({ one }) => ({
    farm: one(farms, {
      fields: [cropRotationRules.farmId],
      references: [farms.id],
    }),
    previousCrop: one(crops, {
      fields: [cropRotationRules.previousCropId],
      references: [crops.id],
      relationName: 'previousCrop',
    }),
    nextCrop: one(crops, {
      fields: [cropRotationRules.nextCropId],
      references: [crops.id],
      relationName: 'nextCrop',
    }),
  }),
);
