import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { farms } from './farms';
import { users } from './users';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .notNull()
      .references(() => farms.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    type: text('type').notNull(), // stock_low, stage_delayed, task_assigned
    title: text('title').notNull(),
    message: text('message').notNull(),
    read: boolean('read').notNull().default(false),
    entityType: text('entity_type'), // asset, log, plan, parcel_calendar
    entityId: uuid('entity_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('notifications_user_idx').on(table.userId),
    index('notifications_farm_idx').on(table.farmId),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  farm: one(farms, {
    fields: [notifications.farmId],
    references: [farms.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
