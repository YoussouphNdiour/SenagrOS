import { TRPCError } from '@trpc/server';
import { and, eq, isNull, desc, ilike, sql, or } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  assets,
  logs,
  logAssets,
  culturalCalendars,
  parcelCalendars,
  crops,
  cropRotationRules,
} from '../db/schema';

export const parcelRouter = router({
  /** Full parcel detail: asset info + geometry */
  getDetail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm' });
      }

      const [parcel] = await ctx.db
        .select({
          id: assets.id,
          name: assets.name,
          status: assets.status,
          data: assets.data,
          notes: assets.notes,
          createdAt: assets.createdAt,
          geojson: sql<string | null>`ST_AsGeoJSON(${assets.geometry})`.as('geojson'),
        })
        .from(assets)
        .where(
          and(
            eq(assets.id, input.id),
            eq(assets.type, 'land'),
            eq(assets.farmId, ctx.session.user.farmId),
            isNull(assets.archivedAt),
          ),
        )
        .limit(1);

      if (!parcel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parcelle introuvable' });
      }

      return parcel;
    }),

  /** Crop history: all cultural calendars assigned to this parcel (newest first) */
  getCropHistory: protectedProcedure
    .input(z.object({ parcelId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm' });
      }

      const rows = await ctx.db
        .select({
          id: parcelCalendars.id,
          status: parcelCalendars.status,
          sowingDate: parcelCalendars.sowingDate,
          expectedHarvestDate: parcelCalendars.expectedHarvestDate,
          actualHarvestDate: parcelCalendars.actualHarvestDate,
          expectedYieldKgHa: parcelCalendars.expectedYieldKgHa,
          notes: parcelCalendars.notes,
          cropType: culturalCalendars.cropType,
          variety: culturalCalendars.variety,
          calendarName: culturalCalendars.name,
          totalDays: culturalCalendars.totalDays,
        })
        .from(parcelCalendars)
        .innerJoin(culturalCalendars, eq(parcelCalendars.calendarId, culturalCalendars.id))
        .where(
          and(
            eq(parcelCalendars.assetId, input.parcelId),
            eq(parcelCalendars.farmId, ctx.session.user.farmId),
          ),
        )
        .orderBy(desc(parcelCalendars.sowingDate));

      return rows;
    }),

  /** Logs linked to this parcel (seeding, harvest, input, observation, activity) */
  getRelatedLogs: protectedProcedure
    .input(
      z.object({
        parcelId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm' });
      }

      const rows = await ctx.db
        .select({
          id: logs.id,
          type: logs.type,
          name: logs.name,
          status: logs.status,
          timestamp: logs.timestamp,
          notes: logs.notes,
          data: logs.data,
        })
        .from(logs)
        .innerJoin(logAssets, eq(logAssets.logId, logs.id))
        .where(
          and(
            eq(logAssets.assetId, input.parcelId),
            eq(logs.farmId, ctx.session.user.farmId),
          ),
        )
        .orderBy(desc(logs.timestamp))
        .limit(input.limit);

      return rows;
    }),

  /** Input logs with withdrawal period alerts for a parcel */
  getInputAlerts: protectedProcedure
    .input(z.object({ parcelId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm' });
      }

      const now = new Date();

      // Get input logs for this parcel that have a withdrawal_days in data
      const inputLogs = await ctx.db
        .select({
          id: logs.id,
          name: logs.name,
          timestamp: logs.timestamp,
          data: logs.data,
        })
        .from(logs)
        .innerJoin(logAssets, eq(logAssets.logId, logs.id))
        .where(
          and(
            eq(logAssets.assetId, input.parcelId),
            eq(logs.type, 'input'),
            eq(logs.farmId, ctx.session.user.farmId),
          ),
        )
        .orderBy(desc(logs.timestamp));

      // Build alerts for inputs still within withdrawal period
      const alerts = inputLogs
        .map((log) => {
          const data = (log.data ?? {}) as Record<string, unknown>;
          const withdrawalDays = data.withdrawal_days as number | undefined;
          if (!withdrawalDays || withdrawalDays <= 0) return null;

          const appliedAt = new Date(log.timestamp);
          const withdrawalEndsAt = new Date(appliedAt.getTime() + withdrawalDays * 86400000);
          const daysLeft = Math.ceil((withdrawalEndsAt.getTime() - now.getTime()) / 86400000);

          if (daysLeft <= 0) return null; // Period has passed

          return {
            logId: log.id,
            productName: (data.product_name as string) ?? log.name,
            appliedAt: appliedAt.toISOString().split('T')[0],
            withdrawalDays,
            withdrawalEndsAt: withdrawalEndsAt.toISOString().split('T')[0],
            daysLeft,
            severity: daysLeft <= 7 ? ('warning' as const) : ('info' as const),
          };
        })
        .filter(Boolean);

      return alerts;
    }),

  /** Rotation recommendations based on last crop on this parcel */
  getRotationRecommendations: protectedProcedure
    .input(z.object({ parcelId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm' });
      }

      // Get the most recent crop on this parcel
      const [lastCalendar] = await ctx.db
        .select({
          cropType: culturalCalendars.cropType,
          variety: culturalCalendars.variety,
          status: parcelCalendars.status,
          actualHarvestDate: parcelCalendars.actualHarvestDate,
          sowingDate: parcelCalendars.sowingDate,
        })
        .from(parcelCalendars)
        .innerJoin(culturalCalendars, eq(parcelCalendars.calendarId, culturalCalendars.id))
        .where(
          and(
            eq(parcelCalendars.assetId, input.parcelId),
            eq(parcelCalendars.farmId, ctx.session.user.farmId),
          ),
        )
        .orderBy(desc(parcelCalendars.sowingDate))
        .limit(1);

      if (!lastCalendar) {
        return { lastCrop: null, recommendations: [], allCrops: await getAllCrops(ctx.db) };
      }

      // Match crop type text to crops table (case-insensitive)
      const cropType = lastCalendar.cropType.trim();

      const [matchedCrop] = await ctx.db
        .select({ id: crops.id, code: crops.code, nameFr: crops.nameFr })
        .from(crops)
        .where(ilike(crops.nameFr, `%${cropType}%`))
        .limit(1);

      if (!matchedCrop) {
        return {
          lastCrop: { cropType, variety: lastCalendar.variety },
          recommendations: [],
          allCrops: await getAllCrops(ctx.db),
        };
      }

      // Get rotation rules where this is the "previous" crop
      const rules = await ctx.db
        .select({
          id: cropRotationRules.id,
          compatibility: cropRotationRules.compatibility,
          reason: cropRotationRules.reason,
          recommendation: cropRotationRules.recommendation,
          minIntervalDays: cropRotationRules.minIntervalDays,
          nextCropId: cropRotationRules.nextCropId,
          nextCropName: crops.nameFr,
          nextCropCode: crops.code,
        })
        .from(cropRotationRules)
        .innerJoin(crops, eq(crops.id, cropRotationRules.nextCropId))
        .where(
          and(
            eq(cropRotationRules.previousCropId, matchedCrop.id),
            or(
              isNull(cropRotationRules.farmId),
              eq(cropRotationRules.farmId, ctx.session.user.farmId),
            ),
          ),
        )
        .orderBy(cropRotationRules.compatibility);

      // Sort: recommended first, then neutral, then avoid, then forbidden
      const order = { recommended: 0, neutral: 1, avoid: 2, forbidden: 3 };
      const sorted = [...rules].sort(
        (a, b) =>
          (order[a.compatibility as keyof typeof order] ?? 1) -
          (order[b.compatibility as keyof typeof order] ?? 1),
      );

      return {
        lastCrop: {
          cropType,
          variety: lastCalendar.variety,
          code: matchedCrop.code,
          status: lastCalendar.status,
        },
        recommendations: sorted,
        allCrops: await getAllCrops(ctx.db),
      };
    }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAllCrops(db: NodePgDatabase<any>) {
  return db
    .select({ id: crops.id, code: crops.code, nameFr: crops.nameFr, cycleShortDays: crops.cycleShortDays })
    .from(crops)
    .orderBy(crops.nameFr);
}
