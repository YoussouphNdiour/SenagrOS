import { TRPCError } from '@trpc/server';
import { and, eq, isNull, sql, gte, lte, desc, count } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { assets } from '../db/schema/assets';
import { logs, logAssets } from '../db/schema/logs';
import { quantities } from '../db/schema/quantities';
import { inventory } from '../db/schema/inventory';
import { parcelCalendars, culturalCalendars } from '../db/schema/calendars';
import {
  reportFilterSchema,
  harvestReportSchema,
  financialsReportSchema,
} from '@/lib/validators/report.validator';

function getFarmId(ctx: { session: { user: { farmId?: string | null } } }) {
  const farmId = ctx.session.user.farmId;
  if (!farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return farmId;
}

export const reportRouter = router({
  // --- Dashboard aggregation ---
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const farmId = getFarmId(ctx);

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Run all queries in parallel
    const [
      assetCounts,
      totalAssets,
      recentLogs,
      lowStockItems,
      monthlyData,
      overdueStages,
      pendingLogs,
    ] = await Promise.all([
      // Asset counts by type
      ctx.db
        .select({
          type: assets.type,
          count: sql<number>`count(*)::int`,
        })
        .from(assets)
        .where(and(eq(assets.farmId, farmId), isNull(assets.archivedAt)))
        .groupBy(assets.type),

      // Total active assets
      ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(assets)
        .where(and(eq(assets.farmId, farmId), isNull(assets.archivedAt))),

      // Recent logs (last 5)
      ctx.db
        .select({
          id: logs.id,
          type: logs.type,
          name: logs.name,
          status: logs.status,
          timestamp: logs.timestamp,
        })
        .from(logs)
        .where(eq(logs.farmId, farmId))
        .orderBy(desc(logs.timestamp))
        .limit(5),

      // Low stock: inventory items with quantity <= 10
      ctx.db
        .select({
          id: inventory.id,
          assetId: inventory.assetId,
          quantity: inventory.quantity,
          unit: inventory.unit,
          assetName: assets.name,
          assetType: assets.type,
        })
        .from(inventory)
        .innerJoin(assets, eq(inventory.assetId, assets.id))
        .where(
          and(
            eq(inventory.farmId, farmId),
            lte(inventory.quantity, '10'),
          ),
        )
        .limit(10),

      // Monthly revenue/expenses for current year
      // Revenue = harvest log quantities (measure = 'value' or unit = 'XOF')
      // Expenses = input log quantities (measure = 'value' or unit = 'XOF')
      ctx.db
        .select({
          month: sql<number>`extract(month from ${logs.timestamp})::int`,
          type: logs.type,
          total: sql<number>`coalesce(sum(${quantities.numerator}), 0)::int`,
        })
        .from(logs)
        .innerJoin(quantities, eq(quantities.logId, logs.id))
        .where(
          and(
            eq(logs.farmId, farmId),
            gte(logs.timestamp, startOfYear),
            sql`${quantities.unit} = 'XOF'`,
          ),
        )
        .groupBy(sql`extract(month from ${logs.timestamp})::int`, logs.type),

      // Overdue calendar stages
      ctx.db
        .select({
          id: parcelCalendars.id,
          assetId: parcelCalendars.assetId,
          sowingDate: parcelCalendars.sowingDate,
          stageStatuses: parcelCalendars.stageStatuses,
          calendarName: culturalCalendars.name,
          assetName: assets.name,
        })
        .from(parcelCalendars)
        .innerJoin(culturalCalendars, eq(parcelCalendars.calendarId, culturalCalendars.id))
        .innerJoin(assets, eq(parcelCalendars.assetId, assets.id))
        .where(
          and(
            eq(parcelCalendars.farmId, farmId),
            eq(parcelCalendars.status, 'active'),
          ),
        )
        .limit(10),

      // Pending tasks (logs with status = 'pending')
      ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(logs)
        .where(and(eq(logs.farmId, farmId), eq(logs.status, 'pending'))),
    ]);

    // Build monthly chart data (12 months)
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const revenue = monthlyData
        .filter((d) => d.month === monthNum && d.type === 'harvest')
        .reduce((sum, d) => sum + d.total, 0);
      const expenses = monthlyData
        .filter((d) => d.month === monthNum && d.type === 'input')
        .reduce((sum, d) => sum + d.total, 0);
      return { month: monthNum, revenue, expenses };
    });

    const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
    const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);

    return {
      patrimoine: totalAssets[0]?.count ?? 0,
      beneficeNet: totalRevenue - totalExpenses,
      totalRevenue,
      totalExpenses,
      assetCounts,
      recentLogs,
      lowStockItems,
      overdueStages,
      pendingTasks: pendingLogs[0]?.count ?? 0,
      monthlyData: months,
    };
  }),

  // --- Assets report ---
  assets: protectedProcedure
    .input(reportFilterSchema)
    .query(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);

      const conditions = [eq(assets.farmId, farmId), isNull(assets.archivedAt)];

      if (input.type) {
        conditions.push(sql`${assets.type} = ${input.type}`);
      }
      if (input.dateFrom) {
        conditions.push(gte(assets.createdAt, new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        conditions.push(lte(assets.createdAt, new Date(input.dateTo)));
      }

      const [byType, byStatus, items] = await Promise.all([
        ctx.db
          .select({
            type: assets.type,
            count: sql<number>`count(*)::int`,
          })
          .from(assets)
          .where(and(...conditions))
          .groupBy(assets.type),

        ctx.db
          .select({
            status: assets.status,
            count: sql<number>`count(*)::int`,
          })
          .from(assets)
          .where(and(...conditions))
          .groupBy(assets.status),

        ctx.db
          .select()
          .from(assets)
          .where(and(...conditions))
          .orderBy(desc(assets.createdAt))
          .limit(100),
      ]);

      const total = byType.reduce((s, t) => s + t.count, 0);

      return { total, byType, byStatus, items };
    }),

  // --- Logs report ---
  logs: protectedProcedure
    .input(reportFilterSchema)
    .query(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);

      const conditions = [eq(logs.farmId, farmId)];

      if (input.type) {
        conditions.push(sql`${logs.type} = ${input.type}`);
      }
      if (input.dateFrom) {
        conditions.push(gte(logs.timestamp, new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        conditions.push(lte(logs.timestamp, new Date(input.dateTo)));
      }

      const [byType, byMonth, items] = await Promise.all([
        ctx.db
          .select({
            type: logs.type,
            count: sql<number>`count(*)::int`,
          })
          .from(logs)
          .where(and(...conditions))
          .groupBy(logs.type),

        ctx.db
          .select({
            month: sql<number>`extract(month from ${logs.timestamp})::int`,
            year: sql<number>`extract(year from ${logs.timestamp})::int`,
            count: sql<number>`count(*)::int`,
          })
          .from(logs)
          .where(and(...conditions))
          .groupBy(
            sql`extract(month from ${logs.timestamp})::int`,
            sql`extract(year from ${logs.timestamp})::int`,
          )
          .orderBy(
            sql`extract(year from ${logs.timestamp})::int`,
            sql`extract(month from ${logs.timestamp})::int`,
          ),

        ctx.db
          .select({
            id: logs.id,
            type: logs.type,
            name: logs.name,
            status: logs.status,
            timestamp: logs.timestamp,
          })
          .from(logs)
          .where(and(...conditions))
          .orderBy(desc(logs.timestamp))
          .limit(100),
      ]);

      const total = byType.reduce((s, t) => s + t.count, 0);

      return { total, byType, byMonth, items };
    }),

  // --- Harvests report ---
  harvests: protectedProcedure
    .input(harvestReportSchema)
    .query(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);

      const conditions = [
        eq(logs.farmId, farmId),
        eq(logs.type, 'harvest'),
      ];

      if (input.dateFrom) {
        conditions.push(gte(logs.timestamp, new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        conditions.push(lte(logs.timestamp, new Date(input.dateTo)));
      }

      // Harvest logs with quantities, grouped by linked asset (crop)
      const harvestData = await ctx.db
        .select({
          logId: logs.id,
          logName: logs.name,
          logTimestamp: logs.timestamp,
          assetId: logAssets.assetId,
          assetName: assets.name,
          assetType: assets.type,
          measure: quantities.measure,
          numerator: quantities.numerator,
          denominator: quantities.denominator,
          unit: quantities.unit,
          label: quantities.label,
        })
        .from(logs)
        .leftJoin(logAssets, eq(logAssets.logId, logs.id))
        .leftJoin(assets, eq(logAssets.assetId, assets.id))
        .leftJoin(quantities, eq(quantities.logId, logs.id))
        .where(and(...conditions))
        .orderBy(desc(logs.timestamp))
        .limit(200);

      // Group by crop
      const byCrop = new Map<string, { name: string; totalKg: number; totalValue: number; count: number }>();

      for (const row of harvestData) {
        const key = row.assetName ?? row.logName;
        const existing = byCrop.get(key) ?? { name: key, totalKg: 0, totalValue: 0, count: 0 };

        if (row.unit === 'kg' && row.numerator) {
          existing.totalKg += row.numerator / (row.denominator ?? 1);
        }
        if (row.unit === 'XOF' && row.numerator) {
          existing.totalValue += row.numerator / (row.denominator ?? 1);
        }
        existing.count += 1;
        byCrop.set(key, existing);
      }

      return {
        total: harvestData.length,
        byCrop: Array.from(byCrop.values()),
        items: harvestData,
      };
    }),

  // --- Financials report (stub — Phase 8) ---
  financials: protectedProcedure
    .input(financialsReportSchema)
    .query(async ({ ctx }) => {
      getFarmId(ctx); // validate access

      return {
        revenue: [],
        expenses: [],
        summary: { totalRevenue: 0, totalExpenses: 0, netProfit: 0 },
        message: 'Module Finances disponible en Phase 8',
      };
    }),
});
