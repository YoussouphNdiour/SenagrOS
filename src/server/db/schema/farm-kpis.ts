import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { farms } from './farms';

/**
 * Indicateurs personnalisés définis par ferme.
 * Ex: "Taux de mortalité objectif", "Rendement riz cible 2025"
 */
export const farmKpiDefinitions = pgTable('farm_kpi_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  /** Unité affichée (%, kg/ha, FCFA/tête, etc.) */
  unit: varchar('unit', { length: 50 }),
  /** 'number' | 'percentage' | 'currency' */
  valueType: varchar('value_type', { length: 20 }).default('number'),
  /** Catégorie: 'elevage' | 'vegetal' | 'finance' | 'autre' */
  category: varchar('category', { length: 50 }).default('autre'),
  /** Valeur cible optionnelle */
  targetValue: numeric('target_value', { precision: 12, scale: 3 }),
  flags: jsonb('flags').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const farmKpiDefinitionsRelations = relations(farmKpiDefinitions, ({ one, many }) => ({
  farm: one(farms, {
    fields: [farmKpiDefinitions.farmId],
    references: [farms.id],
  }),
  values: many(farmKpiValues),
}));

/**
 * Valeurs saisies manuellement pour chaque indicateur.
 */
export const farmKpiValues = pgTable('farm_kpi_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id')
    .references(() => farms.id)
    .notNull(),
  kpiId: uuid('kpi_id')
    .references(() => farmKpiDefinitions.id, { onDelete: 'cascade' })
    .notNull(),
  value: numeric('value', { precision: 12, scale: 3 }).notNull(),
  /** Date de mesure (YYYY-MM-DD) */
  measuredAt: varchar('measured_at', { length: 10 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const farmKpiValuesRelations = relations(farmKpiValues, ({ one }) => ({
  farm: one(farms, {
    fields: [farmKpiValues.farmId],
    references: [farms.id],
  }),
  kpi: one(farmKpiDefinitions, {
    fields: [farmKpiValues.kpiId],
    references: [farmKpiDefinitions.id],
  }),
}));
