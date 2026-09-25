import { TRPCError } from '@trpc/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
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

  saveFarmBoundary: protectedProcedure
    .input(
      z.object({
        coordinates: z.array(z.array(z.array(z.number()).length(2))).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const geojsonStr = JSON.stringify({
        type: 'Polygon',
        coordinates: input.coordinates,
      });

      const [updated] = await ctx.db
        .update(farms)
        .set({
          boundary: sql`ST_SetSRID(ST_GeomFromGeoJSON(${geojsonStr}), 4326)`,
          updatedAt: new Date(),
        })
        .where(eq(farms.id, ctx.session.user.farmId))
        .returning({ id: farms.id });

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Farm not found' });
      }

      return updated;
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
        latitude: farms.latitude,
        longitude: farms.longitude,
        boundaryGeoJSON: sql<string | null>`ST_AsGeoJSON(${farms.boundary})`.as('boundary_geojson'),
      })
      .from(farms)
      .where(eq(farms.id, ctx.session.user.farmId))
      .limit(1);

    if (!farm) return null;
    return {
      name: farm.name,
      latitude: farm.latitude,
      longitude: farm.longitude,
      geojson: farm.boundaryGeoJSON,
    };
  }),
});
