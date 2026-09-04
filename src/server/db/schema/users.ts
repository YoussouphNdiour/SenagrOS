import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';
import { farms } from './farms';
import { revisions } from './revisions';
import { farmMembers } from './farm-members';
import { apiKeys } from './api-keys';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: userRoleEnum('role').default('worker'),
  farmId: uuid('farm_id').references(() => farms.id),
  locale: varchar('locale', { length: 5 }).default('fr'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  farm: one(farms, {
    fields: [users.farmId],
    references: [farms.id],
  }),
  revisions: many(revisions),
  farmMembers: many(farmMembers),
  apiKeys: many(apiKeys),
}));
