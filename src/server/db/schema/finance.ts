import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  decimal,
  index,
} from 'drizzle-orm/pg-core';
import { farms } from './farms';

// --- Transactions (ventes, achats, dépenses, revenus) ---

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .references(() => farms.id)
      .notNull(),
    type: varchar('type', { length: 20 }).notNull(), // sale | purchase | expense | income
    category: varchar('category', { length: 50 }),
    description: varchar('description', { length: 500 }).notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    clientName: varchar('client_name', { length: 255 }),
    productName: varchar('product_name', { length: 255 }),
    quantity: decimal('quantity', { precision: 15, scale: 4 }),
    unitPrice: decimal('unit_price', { precision: 15, scale: 2 }),
    unit: varchar('unit', { length: 20 }),
    paymentMethod: varchar('payment_method', { length: 30 }), // cash | bank | mobile_money
    status: varchar('status', { length: 20 }).default('completed'), // pending | completed | cancelled
    notes: text('notes'),
    data: jsonb('data').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('transactions_farm_id_idx').on(table.farmId),
    index('transactions_type_idx').on(table.type),
    index('transactions_date_idx').on(table.date),
  ],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  farm: one(farms, {
    fields: [transactions.farmId],
    references: [farms.id],
  }),
}));

// --- Invoices (devis, pro forma, factures) ---

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .references(() => farms.id)
      .notNull(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // devis | proforma | facture
    clientName: varchar('client_name', { length: 255 }).notNull(),
    clientEmail: varchar('client_email', { length: 255 }),
    clientPhone: varchar('client_phone', { length: 30 }),
    clientAddress: text('client_address'),
    items: jsonb('items').default([]), // [{productName, quantity, unitPrice, total}]
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
    status: varchar('status', { length: 20 }).default('draft'), // draft | sent | paid | overdue | cancelled
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    notes: text('notes'),
    data: jsonb('data').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('invoices_farm_id_idx').on(table.farmId),
    index('invoices_type_idx').on(table.type),
    index('invoices_status_idx').on(table.status),
  ],
);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  farm: one(farms, {
    fields: [invoices.farmId],
    references: [farms.id],
  }),
}));

// --- Journal Entries (comptabilité simplifiée) ---

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    farmId: uuid('farm_id')
      .references(() => farms.id)
      .notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    label: varchar('label', { length: 500 }).notNull(),
    debit: decimal('debit', { precision: 15, scale: 2 }).default('0'),
    credit: decimal('credit', { precision: 15, scale: 2 }).default('0'),
    category: varchar('category', { length: 50 }),
    account: varchar('account', { length: 100 }), // e.g., Caisse, Banque, Ventes, Achats
    transactionId: uuid('transaction_id').references(() => transactions.id),
    invoiceId: uuid('invoice_id').references(() => invoices.id),
    reference: varchar('reference', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('journal_entries_farm_id_idx').on(table.farmId),
    index('journal_entries_date_idx').on(table.date),
  ],
);

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  farm: one(farms, {
    fields: [journalEntries.farmId],
    references: [farms.id],
  }),
  transaction: one(transactions, {
    fields: [journalEntries.transactionId],
    references: [transactions.id],
  }),
  invoice: one(invoices, {
    fields: [journalEntries.invoiceId],
    references: [invoices.id],
  }),
}));
