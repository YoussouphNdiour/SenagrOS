import { TRPCError } from '@trpc/server';
import { and, eq, desc, sql, ilike, or, gte, lte } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { transactions, invoices, journalEntries } from '../db/schema';
import {
  listTransactionsSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createSaleSchema,
  listInvoicesSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  listJournalSchema,
  financeIdSchema,
  generateInvoiceNumber,
} from '@/lib/validators/finance.validator';

function ensureFarmId(ctx: { session: { user: { farmId?: string | null } } }): string {
  if (!ctx.session.user.farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return ctx.session.user.farmId;
}

export const financeRouter = router({
  // ======== TRANSACTIONS ========

  listTransactions: protectedProcedure
    .input(listTransactionsSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { type, category, status, search, startDate, endDate, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(transactions.farmId, farmId)];
      if (type) conditions.push(eq(transactions.type, type));
      if (category) conditions.push(eq(transactions.category, category));
      if (status) conditions.push(eq(transactions.status, status));
      if (startDate) conditions.push(gte(transactions.date, new Date(startDate)));
      if (endDate) conditions.push(lte(transactions.date, new Date(endDate)));
      if (search) {
        const searchCondition = or(
          ilike(transactions.description, `%${search}%`),
          ilike(transactions.clientName, `%${search}%`),
          ilike(transactions.productName, `%${search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(transactions)
          .where(whereClause)
          .orderBy(desc(transactions.date))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(transactions)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count ?? 0;
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  // --- Sales list (type=sale shortcut) ---
  listSales: protectedProcedure
    .input(listTransactionsSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { search, startDate, endDate, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(transactions.farmId, farmId),
        eq(transactions.type, 'sale'),
      ];
      if (startDate) conditions.push(gte(transactions.date, new Date(startDate)));
      if (endDate) conditions.push(lte(transactions.date, new Date(endDate)));
      if (search) {
        const searchCondition = or(
          ilike(transactions.description, `%${search}%`),
          ilike(transactions.clientName, `%${search}%`),
          ilike(transactions.productName, `%${search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(transactions)
          .where(whereClause)
          .orderBy(desc(transactions.date))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(transactions)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count ?? 0;
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  createTransaction: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [tx] = await ctx.db
        .insert(transactions)
        .values({
          farmId,
          type: input.type,
          category: input.category,
          description: input.description,
          amount: String(input.amount),
          date: new Date(input.date),
          clientName: input.clientName,
          productName: input.productName,
          quantity: input.quantity ? String(input.quantity) : undefined,
          unitPrice: input.unitPrice ? String(input.unitPrice) : undefined,
          unit: input.unit,
          paymentMethod: input.paymentMethod,
          status: input.status ?? 'completed',
          notes: input.notes,
        })
        .returning();

      // Auto-create journal entry
      const isDebit = input.type === 'purchase' || input.type === 'expense';
      await ctx.db.insert(journalEntries).values({
        farmId,
        date: new Date(input.date),
        label: input.description,
        debit: isDebit ? String(input.amount) : '0',
        credit: isDebit ? '0' : String(input.amount),
        category: input.category,
        account: isDebit ? 'charges' : 'produits',
        transactionId: tx.id,
      });

      return tx;
    }),

  // --- Create sale (shortcut) ---
  createSale: protectedProcedure
    .input(createSaleSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const totalAmount = input.quantity * input.unitPrice;

      const [tx] = await ctx.db
        .insert(transactions)
        .values({
          farmId,
          type: 'sale',
          category: 'vente_produit',
          description: `Vente ${input.productName}`,
          amount: String(totalAmount),
          date: new Date(input.date),
          clientName: input.clientName,
          productName: input.productName,
          quantity: String(input.quantity),
          unitPrice: String(input.unitPrice),
          unit: input.unit,
          paymentMethod: input.paymentMethod,
          status: 'completed',
          notes: input.notes,
        })
        .returning();

      // Auto-create journal entry for sale
      await ctx.db.insert(journalEntries).values({
        farmId,
        date: new Date(input.date),
        label: `Vente ${input.productName}${input.clientName ? ` — ${input.clientName}` : ''}`,
        debit: '0',
        credit: String(totalAmount),
        category: 'vente_produit',
        account: 'ventes',
        transactionId: tx.id,
      });

      return tx;
    }),

  updateTransaction: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { id, ...updateData } = input;

      const [existing] = await ctx.db
        .select({ id: transactions.id })
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Transaction not found' });
      }

      const values: Record<string, unknown> = { updatedAt: new Date() };
      if (updateData.type) values.type = updateData.type;
      if (updateData.category) values.category = updateData.category;
      if (updateData.description) values.description = updateData.description;
      if (updateData.amount) values.amount = String(updateData.amount);
      if (updateData.date) values.date = new Date(updateData.date);
      if (updateData.clientName !== undefined) values.clientName = updateData.clientName;
      if (updateData.productName !== undefined) values.productName = updateData.productName;
      if (updateData.quantity) values.quantity = String(updateData.quantity);
      if (updateData.unitPrice) values.unitPrice = String(updateData.unitPrice);
      if (updateData.unit !== undefined) values.unit = updateData.unit;
      if (updateData.paymentMethod) values.paymentMethod = updateData.paymentMethod;
      if (updateData.status) values.status = updateData.status;
      if (updateData.notes !== undefined) values.notes = updateData.notes;

      const [updated] = await ctx.db
        .update(transactions)
        .set(values)
        .where(eq(transactions.id, id))
        .returning();

      return updated;
    }),

  deleteTransaction: protectedProcedure
    .input(financeIdSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [existing] = await ctx.db
        .select({ id: transactions.id })
        .from(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Transaction not found' });
      }

      await ctx.db.delete(journalEntries).where(eq(journalEntries.transactionId, input.id));
      await ctx.db.delete(transactions).where(eq(transactions.id, input.id));

      return { success: true };
    }),

  // --- KPIs for sales page ---
  salesKpis: protectedProcedure
    .query(async ({ ctx }) => {
      const farmId = ensureFarmId(ctx);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const allSales = await ctx.db
        .select({
          amount: transactions.amount,
          date: transactions.date,
          clientName: transactions.clientName,
          productName: transactions.productName,
        })
        .from(transactions)
        .where(and(
          eq(transactions.farmId, farmId),
          eq(transactions.type, 'sale'),
          eq(transactions.status, 'completed'),
        ));

      const caTotal = allSales.reduce((sum, s) => sum + Number(s.amount), 0);

      const monthlySales = allSales.filter(
        (s) => s.date && new Date(s.date) >= startOfMonth,
      );
      const caMois = monthlySales.reduce((sum, s) => sum + Number(s.amount), 0);

      const uniqueClients = new Set(allSales.map((s) => s.clientName).filter(Boolean));
      const uniqueProducts = new Set(allSales.map((s) => s.productName).filter(Boolean));

      return {
        caTotal,
        caMois,
        nbClients: uniqueClients.size,
        nbProduits: uniqueProducts.size,
        nbVentesMois: monthlySales.length,
      };
    }),

  // --- KPIs for finances page ---
  financeKpis: protectedProcedure
    .query(async ({ ctx }) => {
      const farmId = ensureFarmId(ctx);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyTx = await ctx.db
        .select({
          type: transactions.type,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(and(
          eq(transactions.farmId, farmId),
          eq(transactions.status, 'completed'),
          gte(transactions.date, startOfMonth),
        ));

      let revenus = 0;
      let depenses = 0;

      for (const tx of monthlyTx) {
        const amt = Number(tx.amount);
        if (tx.type === 'sale' || tx.type === 'income') {
          revenus += amt;
        } else {
          depenses += amt;
        }
      }

      return {
        soldeNet: revenus - depenses,
        revenus,
        depenses,
        pertes: depenses,
        nbOperations: monthlyTx.length,
      };
    }),

  // ======== INVOICES ========

  listInvoices: protectedProcedure
    .input(listInvoicesSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { type, status, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(invoices.farmId, farmId)];
      if (type) conditions.push(eq(invoices.type, type));
      if (status) conditions.push(eq(invoices.status, status));
      if (search) {
        const searchCondition = or(
          ilike(invoices.invoiceNumber, `%${search}%`),
          ilike(invoices.clientName, `%${search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(invoices)
          .where(whereClause)
          .orderBy(desc(invoices.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(invoices)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count ?? 0;
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  createInvoice: protectedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Generate invoice number based on count of existing invoices of same type
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(and(eq(invoices.farmId, farmId), eq(invoices.type, input.type)));

      const sequence = (countResult?.count ?? 0) + 1;
      const invoiceNumber = generateInvoiceNumber(input.type, sequence);

      const totalAmount = input.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = input.taxAmount ?? 0;

      const [invoice] = await ctx.db
        .insert(invoices)
        .values({
          farmId,
          invoiceNumber,
          type: input.type,
          clientName: input.clientName,
          clientEmail: input.clientEmail || undefined,
          clientPhone: input.clientPhone,
          clientAddress: input.clientAddress,
          items: input.items,
          totalAmount: String(totalAmount + taxAmount),
          taxAmount: String(taxAmount),
          status: 'draft',
          issueDate: new Date(input.issueDate),
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          notes: input.notes,
        })
        .returning();

      return invoice;
    }),

  updateInvoice: protectedProcedure
    .input(updateInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { id, ...updateData } = input;

      const [existing] = await ctx.db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      }

      const values: Record<string, unknown> = { updatedAt: new Date() };
      if (updateData.status) values.status = updateData.status;
      if (updateData.paidAt) values.paidAt = new Date(updateData.paidAt);

      // If marking as paid, auto-create journal entry + transaction
      if (updateData.status === 'paid' && existing.status !== 'paid') {
        values.paidAt = updateData.paidAt ? new Date(updateData.paidAt) : new Date();

        const [tx] = await ctx.db
          .insert(transactions)
          .values({
            farmId,
            type: 'sale',
            category: 'vente_produit',
            description: `Paiement facture ${existing.invoiceNumber}`,
            amount: existing.totalAmount,
            date: new Date(),
            clientName: existing.clientName,
            status: 'completed',
          })
          .returning();

        await ctx.db.insert(journalEntries).values({
          farmId,
          date: new Date(),
          label: `Paiement facture ${existing.invoiceNumber} — ${existing.clientName}`,
          debit: '0',
          credit: existing.totalAmount,
          category: 'vente_produit',
          account: 'ventes',
          transactionId: tx.id,
          invoiceId: id,
          reference: existing.invoiceNumber,
        });
      }

      const [updated] = await ctx.db
        .update(invoices)
        .set(values)
        .where(eq(invoices.id, id))
        .returning();

      return updated;
    }),

  deleteInvoice: protectedProcedure
    .input(financeIdSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [existing] = await ctx.db
        .select({ id: invoices.id })
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      }

      await ctx.db.delete(journalEntries).where(eq(journalEntries.invoiceId, input.id));
      await ctx.db.delete(invoices).where(eq(invoices.id, input.id));

      return { success: true };
    }),

  // --- Invoice KPIs ---
  invoiceKpis: protectedProcedure
    .query(async ({ ctx }) => {
      const farmId = ensureFarmId(ctx);

      const all = await ctx.db
        .select({
          type: invoices.type,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
        })
        .from(invoices)
        .where(eq(invoices.farmId, farmId));

      const devis = all.filter((i) => i.type === 'devis').length;
      const proforma = all.filter((i) => i.type === 'proforma').length;
      const factures = all.filter((i) => i.type === 'facture').length;
      const totalMontant = all
        .filter((i) => i.type === 'facture')
        .reduce((sum, i) => sum + Number(i.totalAmount), 0);

      return { devis, proforma, factures, totalMontant };
    }),

  // ======== JOURNAL / COMPTABILITÉ ========

  listJournal: protectedProcedure
    .input(listJournalSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { category, account, search, startDate, endDate, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(journalEntries.farmId, farmId)];
      if (category) conditions.push(eq(journalEntries.category, category));
      if (account) conditions.push(eq(journalEntries.account, account));
      if (startDate) conditions.push(gte(journalEntries.date, new Date(startDate)));
      if (endDate) conditions.push(lte(journalEntries.date, new Date(endDate)));
      if (search) {
        const searchCondition = or(
          ilike(journalEntries.label, `%${search}%`),
          ilike(journalEntries.reference, `%${search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = and(...conditions);

      const [items, countResult, totalsResult] = await Promise.all([
        ctx.db
          .select()
          .from(journalEntries)
          .where(whereClause)
          .orderBy(desc(journalEntries.date))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(journalEntries)
          .where(whereClause),
        ctx.db
          .select({
            totalDebit: sql<number>`coalesce(sum(debit::numeric), 0)::float`,
            totalCredit: sql<number>`coalesce(sum(credit::numeric), 0)::float`,
          })
          .from(journalEntries)
          .where(and(eq(journalEntries.farmId, farmId))),
      ]);

      const total = countResult[0]?.count ?? 0;
      const totalDebit = totalsResult[0]?.totalDebit ?? 0;
      const totalCredit = totalsResult[0]?.totalCredit ?? 0;

      return {
        items,
        total,
        page,
        pages: Math.ceil(total / limit),
        totalDebit,
        totalCredit,
        solde: totalCredit - totalDebit,
      };
    }),
});
