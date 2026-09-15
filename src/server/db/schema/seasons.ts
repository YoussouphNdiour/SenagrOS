import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';
import { seasonTypeEnum } from './enums';
import { farms } from './farms';

export const seasons = pgTable('seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: seasonTypeEnum('type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  year: integer('year').notNull(),
  status: varchar('status', { length: 20 }).default('planning'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const seasonsRelations = relations(seasons, ({ one }) => ({
  farm: one(farms, {
    fields: [seasons.farmId],
    references: [farms.id],
  }),
}));
