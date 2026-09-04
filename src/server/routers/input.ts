import { TRPCError } from '@trpc/server';
import { and, eq, ilike, isNull, sql, desc } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { assets, inventory, logAssets } from '../db/schema';
import {
  listPhytoSchema,
  listFertiSchema,
  listSemenceSchema,
  createInputSchema,
  updateInputSchema,
  getStockSchema,
  applyToLogSchema,
} from '@/lib/validators/input.validator';

function ensureFarmId(ctx: { session: { user: { farmId?: string | null } } }): string {
  if (!ctx.session.user.farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return ctx.session.user.farmId;
}

export const inputRouter = router({
  listPhyto: protectedProcedure
    .input(listPhytoSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { subcategory, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(assets.farmId, farmId),
        eq(assets.type, 'material'),
        isNull(assets.archivedAt),
        sql`${assets.data}->>'input_category' = 'phyto'`,
      ];

      if (subcategory) {
        conditions.push(sql`${assets.data}->>'input_subcategory' = ${subcategory}`);
      }
      if (search) {
        conditions.push(ilike(assets.name, `%${search}%`));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db.select().from(assets).where(where).orderBy(desc(assets.createdAt)).limit(limit).offset(offset),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(assets).where(where),
      ]);

      return { items, total: countResult[0]?.count ?? 0, page, pages: Math.ceil((countResult[0]?.count ?? 0) / limit) };
    }),

  listFerti: protectedProcedure
    .input(listFertiSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { subcategory, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(assets.farmId, farmId),
        eq(assets.type, 'material'),
        isNull(assets.archivedAt),
        sql`${assets.data}->>'input_category' = 'ferti'`,
      ];

      if (subcategory) {
        conditions.push(sql`${assets.data}->>'input_subcategory' = ${subcategory}`);
      }
      if (search) {
        conditions.push(ilike(assets.name, `%${search}%`));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db.select().from(assets).where(where).orderBy(desc(assets.createdAt)).limit(limit).offset(offset),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(assets).where(where),
      ]);

      return { items, total: countResult[0]?.count ?? 0, page, pages: Math.ceil((countResult[0]?.count ?? 0) / limit) };
    }),

  listSemence: protectedProcedure
    .input(listSemenceSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { subcategory, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(assets.farmId, farmId),
        eq(assets.type, 'seed'),
        isNull(assets.archivedAt),
      ];

      if (subcategory) {
        conditions.push(sql`${assets.data}->>'input_subcategory' = ${subcategory}`);
      }
      if (search) {
        conditions.push(ilike(assets.name, `%${search}%`));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db.select().from(assets).where(where).orderBy(desc(assets.createdAt)).limit(limit).offset(offset),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(assets).where(where),
      ]);

      return { items, total: countResult[0]?.count ?? 0, page, pages: Math.ceil((countResult[0]?.count ?? 0) / limit) };
    }),

  create: protectedProcedure
    .input(createInputSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      let assetType: 'material' | 'seed';
      let data: Record<string, unknown>;

      if (input.inputCategory === 'phyto') {
        assetType = 'material';
        data = {
          input_category: 'phyto',
          input_subcategory: input.inputSubcategory,
          commercial_name: input.commercialName,
          active_ingredient: input.activeIngredient,
          recommended_dose: input.recommendedDose,
          dar_days: input.darDays,
          toxicity_class: input.toxicityClass,
          form: input.form,
          stock_unit: input.stockUnit,
          unit_price_xof: input.unitPriceXof,
          stock_threshold: input.stockThreshold,
        };
      } else if (input.inputCategory === 'ferti') {
        assetType = 'material';
        data = {
          input_category: 'ferti',
          input_subcategory: input.inputSubcategory,
          commercial_name: input.commercialName,
          composition_npk: input.compositionNpk,
          recommended_dose: input.recommendedDose,
          form: input.form,
          stock_unit: input.stockUnit,
          unit_price_xof: input.unitPriceXof,
          stock_threshold: input.stockThreshold,
        };
      } else {
        assetType = 'seed';
        data = {
          input_category: 'semence',
          input_subcategory: input.inputSubcategory,
          crop_type: input.cropType,
          variety: input.variety,
          lot_number: input.lotNumber,
          germination_rate: input.germinationRate,
          origin: input.origin,
          seed_treatment: input.seedTreatment,
          certification: input.certification,
          stock_unit: input.stockUnit,
          unit_price_xof: input.unitPriceXof,
          stock_threshold: input.stockThreshold,
        };
      }

      const [created] = await ctx.db
        .insert(assets)
        .values({
          type: assetType,
          name: input.name,
          farmId,
          notes: input.notes,
          data,
        })
        .returning();

      // Insert initial stock if > 0
      if (input.stockInitial > 0) {
        await ctx.db.insert(inventory).values({
          assetId: created.id,
          quantity: String(input.stockInitial),
          unit: input.stockUnit,
          farmId,
        });
      }

      return created;
    }),

  update: protectedProcedure
    .input(updateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { id, ...updateData } = input;

      const [updated] = await ctx.db
        .update(assets)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(assets.id, id), eq(assets.farmId, farmId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Intrant not found' });
      }

      return updated;
    }),

  getStock: protectedProcedure
    .input(getStockSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [asset] = await ctx.db
        .select()
        .from(assets)
        .where(and(eq(assets.id, input.assetId), eq(assets.farmId, farmId)))
        .limit(1);

      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      const [stockResult] = await ctx.db
        .select({ total: sql<string>`COALESCE(SUM(${inventory.quantity}), 0)` })
        .from(inventory)
        .where(and(eq(inventory.assetId, input.assetId), eq(inventory.farmId, farmId)));

      const movements = await ctx.db
        .select()
        .from(inventory)
        .where(and(eq(inventory.assetId, input.assetId), eq(inventory.farmId, farmId)))
        .orderBy(desc(inventory.createdAt));

      const data = asset.data as Record<string, unknown> | null;

      return {
        current: Number(stockResult?.total ?? 0),
        unit: (data?.stock_unit as string) ?? 'unite',
        movements,
      };
    }),

  applyToLog: protectedProcedure
    .input(applyToLogSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Calculate total quantity to decrement
      const totalQuantity = input.treatedSurfaceHa
        ? input.dose * input.treatedSurfaceHa
        : input.dose;

      // Check current stock
      const [stockResult] = await ctx.db
        .select({ total: sql<string>`COALESCE(SUM(${inventory.quantity}), 0)` })
        .from(inventory)
        .where(and(eq(inventory.assetId, input.assetId), eq(inventory.farmId, farmId)));

      const currentStock = Number(stockResult?.total ?? 0);
      if (currentStock < totalQuantity) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Stock insuffisant. Disponible: ${currentStock}, requis: ${totalQuantity}`,
        });
      }

      // Link asset to log with role 'input'
      await ctx.db
        .insert(logAssets)
        .values({ logId: input.logId, assetId: input.assetId, role: 'input' })
        .onConflictDoNothing();

      // Decrement inventory (negative quantity)
      const [movement] = await ctx.db
        .insert(inventory)
        .values({
          assetId: input.assetId,
          quantity: String(-totalQuantity),
          unit: input.doseUnit,
          logId: input.logId,
          farmId,
        })
        .returning();

      return { movement, applied: totalQuantity };
    }),
});
