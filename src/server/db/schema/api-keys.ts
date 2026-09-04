import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { farms } from './farms';
import { users } from './users';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  permissions: jsonb('permissions').default([]),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  farm: one(farms, {
    fields: [apiKeys.farmId],
    references: [farms.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));
