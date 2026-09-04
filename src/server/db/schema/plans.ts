import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  jsonb,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { farms } from './farms';
import { logs } from './logs';

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  season: varchar('season', { length: 50 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  notes: text('notes'),
  flags: jsonb('flags').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const plansRelations = relations(plans, ({ one, many }) => ({
  farm: one(farms, {
    fields: [plans.farmId],
    references: [farms.id],
  }),
  planLogs: many(planLogs),
}));

export const planLogs = pgTable(
  'plan_logs',
  {
    planId: uuid('plan_id')
      .references(() => plans.id)
      .notNull(),
    logId: uuid('log_id')
      .references(() => logs.id)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.planId, table.logId] })],
);

export const planLogsRelations = relations(planLogs, ({ one }) => ({
  plan: one(plans, {
    fields: [planLogs.planId],
    references: [plans.id],
  }),
  log: one(logs, {
    fields: [planLogs.logId],
    references: [logs.id],
  }),
}));
