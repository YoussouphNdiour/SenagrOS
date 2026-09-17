import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { plans } from './plans';

export const plannedTasks = pgTable(
  'planned_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }),
    dayOffset: integer('day_offset').default(0),
    plannedDate: timestamp('planned_date', { withTimezone: true }),
    duration: integer('duration'),
    status: varchar('status', { length: 20 }).default('planned'),
    inputs: jsonb('inputs').default([]),
    notes: text('notes'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('planned_tasks_plan_id_idx').on(table.planId),
    index('planned_tasks_sort_order_idx').on(table.planId, table.sortOrder),
  ],
);

export const plannedTasksRelations = relations(plannedTasks, ({ one }) => ({
  plan: one(plans, {
    fields: [plannedTasks.planId],
    references: [plans.id],
  }),
}));
