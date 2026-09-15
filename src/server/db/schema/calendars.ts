import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';
import { farms } from './farms';
import { assets } from './assets';

export const culturalCalendars = pgTable('cultural_calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  cropType: varchar('crop_type', { length: 100 }).notNull(),
  variety: varchar('variety', { length: 100 }),
  stages: jsonb('stages').notNull(),
  totalDays: integer('total_days'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const culturalCalendarsRelations = relations(
  culturalCalendars,
  ({ one, many }) => ({
    farm: one(farms, {
      fields: [culturalCalendars.farmId],
      references: [farms.id],
    }),
    parcelCalendars: many(parcelCalendars),
  }),
);

export const parcelCalendars = pgTable('parcel_calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  assetId: uuid('asset_id')
    .references(() => assets.id)
    .notNull(),
  calendarId: uuid('calendar_id')
    .references(() => culturalCalendars.id)
    .notNull(),
  sowingDate: date('sowing_date').notNull(),
  stageStatuses: jsonb('stage_statuses').default([]),
  expectedHarvestDate: date('expected_harvest_date'),
  actualHarvestDate: date('actual_harvest_date'),
  status: varchar('status', { length: 20 }).default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const parcelCalendarsRelations = relations(
  parcelCalendars,
  ({ one }) => ({
    farm: one(farms, {
      fields: [parcelCalendars.farmId],
      references: [farms.id],
    }),
    asset: one(assets, {
      fields: [parcelCalendars.assetId],
      references: [assets.id],
    }),
    calendar: one(culturalCalendars, {
      fields: [parcelCalendars.calendarId],
      references: [culturalCalendars.id],
    }),
  }),
);
