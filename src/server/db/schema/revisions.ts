import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const revisions = pgTable(
  'revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: varchar('entity_type', { length: 20 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    revisionNumber: integer('revision_number').notNull(),
    data: jsonb('data').notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    message: text('message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('revisions_entity_revision_idx').on(
      table.entityType,
      table.entityId,
      table.revisionNumber,
    ),
  ],
);

export const revisionsRelations = relations(revisions, ({ one }) => ({
  user: one(users, {
    fields: [revisions.userId],
    references: [users.id],
  }),
}));
