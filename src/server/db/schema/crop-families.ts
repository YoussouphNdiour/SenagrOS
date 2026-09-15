import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { crops } from './crops';

export const cropFamilies = pgTable('crop_families', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cropFamiliesRelations = relations(cropFamilies, ({ many }) => ({
  crops: many(crops),
}));
