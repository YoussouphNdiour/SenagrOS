import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { postgisGeometry } from './postgis';
import { users } from './users';
import { assets } from './assets';
import { logs } from './logs';
import { plans } from './plans';
import { inventory } from './inventory';
import { farmMembers, farmInvitations } from './farm-members';
import { apiKeys } from './api-keys';
import { culturalCalendars, parcelCalendars } from './calendars';

export const farms = pgTable('farms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  latitude: varchar('latitude', { length: 20 }),
  longitude: varchar('longitude', { length: 20 }),
  timezone: varchar('timezone', { length: 50 }).default('Africa/Dakar'),
  currency: varchar('currency', { length: 3 }).default('XOF'),
  locale: varchar('locale', { length: 5 }).default('fr'),
  seasonType: varchar('season_type', { length: 20 }).default('hivernage'),
  boundary: postgisGeometry('boundary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const farmsRelations = relations(farms, ({ many }) => ({
  users: many(users),
  assets: many(assets),
  logs: many(logs),
  plans: many(plans),
  inventory: many(inventory),
  farmMembers: many(farmMembers),
  farmInvitations: many(farmInvitations),
  apiKeys: many(apiKeys),
  culturalCalendars: many(culturalCalendars),
  parcelCalendars: many(parcelCalendars),
}));
