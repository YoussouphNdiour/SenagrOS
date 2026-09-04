import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { farms } from './farms';
import { users } from './users';

export const farmMembers = pgTable(
  'farm_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .references(() => farms.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('farm_members_farm_user_idx').on(table.farmId, table.userId),
  ],
);

export const farmMembersRelations = relations(farmMembers, ({ one }) => ({
  farm: one(farms, {
    fields: [farmMembers.farmId],
    references: [farms.id],
  }),
  user: one(users, {
    fields: [farmMembers.userId],
    references: [users.id],
  }),
}));

export const farmInvitations = pgTable('farm_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  invitedBy: uuid('invited_by')
    .references(() => users.id)
    .notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const farmInvitationsRelations = relations(
  farmInvitations,
  ({ one }) => ({
    farm: one(farms, {
      fields: [farmInvitations.farmId],
      references: [farms.id],
    }),
    inviter: one(users, {
      fields: [farmInvitations.invitedBy],
      references: [users.id],
    }),
  }),
);
