import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { farms } from './farms';

export const cooperatives = pgTable('cooperatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  region: varchar('region', { length: 100 }),
  type: varchar('type', { length: 50 }).default('cooperative'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cooperativesRelations = relations(cooperatives, ({ one, many }) => ({
  creator: one(users, {
    fields: [cooperatives.createdBy],
    references: [users.id],
  }),
  members: many(cooperativeMembers),
  invitations: many(cooperativeInvitations),
}));

export const cooperativeMembers = pgTable(
  'cooperative_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cooperativeId: uuid('cooperative_id')
      .references(() => cooperatives.id, { onDelete: 'cascade' })
      .notNull(),
    farmId: uuid('farm_id')
      .references(() => farms.id, { onDelete: 'cascade' })
      .notNull(),
    role: varchar('role', { length: 20 }).default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('cooperative_members_coop_farm_idx').on(
      table.cooperativeId,
      table.farmId,
    ),
  ],
);

export const cooperativeMembersRelations = relations(
  cooperativeMembers,
  ({ one }) => ({
    cooperative: one(cooperatives, {
      fields: [cooperativeMembers.cooperativeId],
      references: [cooperatives.id],
    }),
    farm: one(farms, {
      fields: [cooperativeMembers.farmId],
      references: [farms.id],
    }),
  }),
);

export const cooperativeInvitations = pgTable('cooperative_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  cooperativeId: uuid('cooperative_id')
    .references(() => cooperatives.id, { onDelete: 'cascade' })
    .notNull(),
  invitedBy: uuid('invited_by')
    .references(() => users.id)
    .notNull(),
  farmId: uuid('farm_id')
    .references(() => farms.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cooperativeInvitationsRelations = relations(
  cooperativeInvitations,
  ({ one }) => ({
    cooperative: one(cooperatives, {
      fields: [cooperativeInvitations.cooperativeId],
      references: [cooperatives.id],
    }),
    inviter: one(users, {
      fields: [cooperativeInvitations.invitedBy],
      references: [users.id],
    }),
    farm: one(farms, {
      fields: [cooperativeInvitations.farmId],
      references: [farms.id],
    }),
  }),
);
