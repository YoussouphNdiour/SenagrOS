import { TRPCError } from '@trpc/server';
import { and, eq, ilike, isNull, sql, desc } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { assets, inventory } from '../db/schema';
import {
  listInventorySchema,
  getInventoryByAssetSchema,
  adjustInventorySchema,
  alertsInventorySchema,
} from '@/lib/validators/input.validator';

function ensureFarmId(ctx: { session: { user: { farmId?: string | null } } }): string {
  if (!ctx.session.user.farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return ctx.session.user.farmId;
}

export const inventoryRouter = router({
  list: protectedProcedure
    .input(listInventorySchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { category, search, page, limit } = input;
      const offset = (page - 1) * limit;

      // Build conditions for assets that are intrants (material with input_category OR seed)
      const conditions = [
        eq(assets.farmId, farmId),
        isNull(assets.archivedAt),
      ];

      if (category === 'semence') {
        conditions.push(eq(assets.type, 'seed'));
      } else if (category) {
        conditions.push(eq(assets.type, 'material'));
        conditions.push(sql`${assets.data}->>'input_category' = ${category}`);
      } else {
        // All intrants: material with input_category OR seed
        conditions.push(
          sql`(${assets.type} = 'material' AND ${assets.data}->>'input_category' IS NOT NULL) OR ${assets.type} = 'seed'`,
        );
      }

      if (search) {
        conditions.push(ilike(assets.name, `%${search}%`));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select({
            asset: assets,
            currentStock: sql<string>`COALESCE((SELECT SUM(${inventory.quantity}) FROM ${inventory} WHERE ${inventory.assetId} = ${assets.id} AND ${inventory.farmId} = ${farmId}), 0)`,
          })
          .from(assets)
          .where(where)
          .orderBy(desc(assets.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(assets)
          .where(where),
      ]);

      const result = items.map((row) => {
        const data = row.asset.data as Record<string, unknown> | null;
        return {
          ...row.asset,
          currentStock: Number(row.currentStock),
          stockUnit: (data?.stock_unit as string) ?? 'unite',
          unitPriceXof: Number((data?.unit_price_xof as number) ?? 0),
          stockThreshold: Number((data?.stock_threshold as number) ?? 0),
          valorisation: Number(row.currentStock) * Number((data?.unit_price_xof as number) ?? 0),
        };
      });

      return {
        items: result,
        total: countResult[0]?.count ?? 0,
        page,
        pages: Math.ceil((countResult[0]?.count ?? 0) / limit),
      };
    }),

  getByAsset: protectedProcedure
    .input(getInventoryByAssetSchema)
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
      const currentStock = Number(stockResult?.total ?? 0);

      return {
        asset,
        currentStock,
        stockUnit: (data?.stock_unit as string) ?? 'unite',
        unitPriceXof: Number((data?.unit_price_xof as number) ?? 0),
        stockThreshold: Number((data?.stock_threshold as number) ?? 0),
        valorisation: currentStock * Number((data?.unit_price_xof as number) ?? 0),
        movements,
      };
    }),

  adjust: protectedProcedure
    .input(adjustInventorySchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Verify asset belongs to farm
      const [asset] = await ctx.db
        .select()
        .from(assets)
        .where(and(eq(assets.id, input.assetId), eq(assets.farmId, farmId)))
        .limit(1);

      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      let insertQuantity: number;

      if (input.type === 'reset') {
        // Calculate difference to reach target
        const [stockResult] = await ctx.db
          .select({ total: sql<string>`COALESCE(SUM(${inventory.quantity}), 0)` })
          .from(inventory)
          .where(and(eq(inventory.assetId, input.assetId), eq(inventory.farmId, farmId)));
        const current = Number(stockResult?.total ?? 0);
        insertQuantity = input.quantity - current;
      } else if (input.type === 'decrement') {
        insertQuantity = -input.quantity;
      } else {
        insertQuantity = input.quantity;
      }

      const [movement] = await ctx.db
        .insert(inventory)
        .values({
          assetId: input.assetId,
          quantity: String(insertQuantity),
          unit: input.unit,
          logId: input.logId,
          farmId,
        })
        .returning();

      return movement;
    }),

  alerts: protectedProcedure
    .input(alertsInventorySchema)
    .query(async ({ ctx }) => {
      const farmId = ensureFarmId(ctx);

      // Get all intrant assets with their stock
      const intrantAssets = await ctx.db
        .select({
          asset: assets,
          currentStock: sql<string>`COALESCE((SELECT SUM(${inventory.quantity}) FROM ${inventory} WHERE ${inventory.assetId} = ${assets.id} AND ${inventory.farmId} = ${farmId}), 0)`,
        })
        .from(assets)
        .where(
          and(
            eq(assets.farmId, farmId),
            isNull(assets.archivedAt),
            sql`(${assets.type} = 'material' AND ${assets.data}->>'input_category' IS NOT NULL) OR ${assets.type} = 'seed'`,
          ),
        );

      return intrantAssets
        .filter((row) => {
          const data = row.asset.data as Record<string, unknown> | null;
          const threshold = Number((data?.stock_threshold as number) ?? 0);
          return threshold > 0 && Number(row.currentStock) < threshold;
        })
        .map((row) => {
          const data = row.asset.data as Record<string, unknown> | null;
          return {
            asset: row.asset,
            current: Number(row.currentStock),
            threshold: Number((data?.stock_threshold as number) ?? 0),
            stockUnit: (data?.stock_unit as string) ?? 'unite',
          };
        });
    }),

  /** KPI aggregates for the intrants overview page */
  kpis: protectedProcedure
    .query(async ({ ctx }) => {
      const farmId = ensureFarmId(ctx);

      const intrantCondition = and(
        eq(assets.farmId, farmId),
        isNull(assets.archivedAt),
        sql`(${assets.type} = 'material' AND ${assets.data}->>'input_category' IS NOT NULL) OR ${assets.type} = 'seed'`,
      );

      // All intrant assets with stock info
      const rows = await ctx.db
        .select({
          asset: assets,
          currentStock: sql<string>`COALESCE((SELECT SUM(${inventory.quantity}) FROM ${inventory} WHERE ${inventory.assetId} = ${assets.id} AND ${inventory.farmId} = ${farmId}), 0)`,
        })
        .from(assets)
        .where(intrantCondition);

      let totalArticles = 0;
      let valorisationTotal = 0;
      let alertCount = 0;
      let phytoCount = 0;
      let fertiCount = 0;
      let semenceCount = 0;

      for (const row of rows) {
        totalArticles++;
        const data = row.asset.data as Record<string, unknown> | null;
        const stock = Number(row.currentStock);
        const price = Number((data?.unit_price_xof as number) ?? 0);
        const threshold = Number((data?.stock_threshold as number) ?? 0);
        const category = (data?.input_category as string) ?? '';

        valorisationTotal += stock * price;

        if (threshold > 0 && stock < threshold) {
          alertCount++;
        }

        if (category === 'phyto') phytoCount++;
        else if (category === 'ferti') fertiCount++;
        else if (row.asset.type === 'seed' || category === 'semence') semenceCount++;
      }

      return {
        totalArticles,
        valorisationTotal,
        alertCount,
        phytoCount,
        fertiCount,
        semenceCount,
      };
    }),
});
