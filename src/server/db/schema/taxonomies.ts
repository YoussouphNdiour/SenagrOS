import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { farms } from './farms';

export const taxonomies = pgTable('taxonomies', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  farmId: uuid('farm_id').references(() => farms.id),
  data: jsonb('data').default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const taxonomiesRelations = relations(taxonomies, ({ one, many }) => ({
  farm: one(farms, {
    fields: [taxonomies.farmId],
    references: [farms.id],
  }),
  parent: one(taxonomies, {
    fields: [taxonomies.parentId],
    references: [taxonomies.id],
    relationName: 'taxonomyParent',
  }),
  children: many(taxonomies, { relationName: 'taxonomyParent' }),
}));
