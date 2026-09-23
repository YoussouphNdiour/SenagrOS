import { TRPCError } from '@trpc/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { assets, farms } from '../db/schema';

export const mapRouter = router({
  getParcels: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.farmId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No farm associated with this account',
      });
    }

    const parcels = await ctx.db
      .select({
        id: assets.id,
        name: assets.name,
        status: assets.status,
        data: assets.data,
        geojson: sql<string | null>`ST_AsGeoJSON(${assets.geometry})`.as('geojson'),
      })
      .from(assets)
      .where(
        and(
          eq(assets.type, 'land'),
          eq(assets.farmId, ctx.session.user.farmId),
          isNull(assets.archivedAt),
        ),
      );

    return parcels;
  }),

  getFarmBoundary: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.farmId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No farm associated with this account',
      });
    }

    const [farm] = await ctx.db
      .select({
        id: farms.id,
        name: farms.name,
        boundaryGeoJSON: sql<string | null>`ST_AsGeoJSON(${farms.boundary})`.as('boundary_geojson'),
      })
      .from(farms)
      .where(eq(farms.id, ctx.session.user.farmId))
      .limit(1);

    if (!farm) return null;
    return {
      name: farm.name,
      geojson: farm.boundaryGeoJSON,
    };
  }),
});
