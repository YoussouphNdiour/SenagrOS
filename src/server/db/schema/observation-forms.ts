import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  date,
  time,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { logs } from './logs';
import { assets } from './assets';
import { users } from './users';

export const observationForms = pgTable('observation_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  logId: uuid('log_id')
    .references(() => logs.id, { onDelete: 'cascade' })
    .notNull(),
  formType: varchar('form_type', { length: 50 }).notNull(),
  assetId: uuid('asset_id')
    .references(() => assets.id)
    .notNull(),
  cropType: varchar('crop_type', { length: 100 }),
  variety: varchar('variety', { length: 100 }),
  observerId: uuid('observer_id')
    .references(() => users.id)
    .notNull(),
  supervisorId: uuid('supervisor_id').references(() => users.id),
  observationDate: date('observation_date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  observedSurfaceHa: decimal('observed_surface_ha', {
    precision: 10,
    scale: 4,
  }),
  formData: jsonb('form_data').notNull(),
  calculated: jsonb('calculated').default({}),
  observerRemarks: text('observer_remarks'),
  supervisorRemarks: text('supervisor_remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const observationFormsRelations = relations(
  observationForms,
  ({ one }) => ({
    log: one(logs, {
      fields: [observationForms.logId],
      references: [logs.id],
    }),
    asset: one(assets, {
      fields: [observationForms.assetId],
      references: [assets.id],
    }),
    observer: one(users, {
      fields: [observationForms.observerId],
      references: [users.id],
      relationName: 'observer',
    }),
    supervisor: one(users, {
      fields: [observationForms.supervisorId],
      references: [users.id],
      relationName: 'supervisor',
    }),
  }),
);
