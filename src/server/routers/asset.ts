import { TRPCError } from '@trpc/server';
import { and, eq, ilike, isNull, sql, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { assets } from '../db/schema';
import {
  createAssetSchema,
  updateAssetSchema,
  listAssetsSchema,
  getAssetByIdSchema,
  archiveAssetSchema,
} from '@/lib/validators/asset.validator';

export const assetRouter = router({
  list: protectedProcedure
    .input(listAssetsSchema)
    .query(async ({ ctx, input }) => {
      const { type, status, search, page, limit } = input;

      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const farmId = ctx.session.user.farmId;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(assets.farmId, farmId),
        isNull(assets.archivedAt),
      ];

      if (type) {
        conditions.push(eq(assets.type, type));
      }

      if (status) {
        conditions.push(eq(assets.status, status));
      }

      if (search) {
        conditions.push(ilike(assets.name, `%${search}%`));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
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

      const total = countResult[0]?.count ?? 0;

      return {
        items,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  getById: protectedProcedure
    .input(getAssetByIdSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [asset] = await ctx.db
        .select()
        .from(assets)
        .where(and(eq(assets.id, input.id), eq(assets.farmId, ctx.session.user.farmId)))
        .limit(1);

      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      // Fetch children — scoped to same farm
      const children = await ctx.db
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.parentId, input.id),
            eq(assets.farmId, ctx.session.user.farmId),
            isNull(assets.archivedAt),
          ),
        );

      return { ...asset, children };
    }),

  create: protectedProcedure
    .input(createAssetSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [created] = await ctx.db
        .insert(assets)
        .values({
          type: input.type,
          name: input.name,
          farmId: ctx.session.user.farmId, // always use server-side farmId — never trust client
          parentId: input.parentId,
          notes: input.notes,
          data: input.data ?? {},
          flags: input.flags ?? [],
          isLocation: input.isLocation ?? false,
          isFixed: input.isFixed ?? false,
          idTags: input.idTags ?? [],
        })
        .returning();

      return created;
    }),

  update: protectedProcedure
    .input(updateAssetSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(assets)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(assets.id, id), eq(assets.farmId, ctx.session.user.farmId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      return updated;
    }),

  updateGeometry: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        coordinates: z
          .array(z.array(z.array(z.number()).length(2)))
          .min(1, 'At least one ring required'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      // Verify the asset belongs to this farm and is a land parcel
      const [existing] = await ctx.db
        .select({ id: assets.id, data: assets.data })
        .from(assets)
        .where(
          and(
            eq(assets.id, input.id),
            eq(assets.farmId, ctx.session.user.farmId),
            isNull(assets.archivedAt),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      const geojsonStr = JSON.stringify({
        type: 'Polygon',
        coordinates: input.coordinates,
      });

      const mergedData = {
        ...((existing.data as Record<string, unknown>) ?? {}),
        coordinates: input.coordinates,
      };

      const [updated] = await ctx.db
        .update(assets)
        .set({
          data: mergedData,
          geometry: sql`ST_SetSRID(ST_GeomFromGeoJSON(${geojsonStr}), 4326)`,
          updatedAt: new Date(),
        })
        .where(and(eq(assets.id, input.id), eq(assets.farmId, ctx.session.user.farmId)))
        .returning({ id: assets.id, name: assets.name });

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found after update' });
      }

      return updated;
    }),

  archive: protectedProcedure
    .input(archiveAssetSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [archived] = await ctx.db
        .update(assets)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(assets.id, input.id), eq(assets.farmId, ctx.session.user.farmId)))
        .returning();

      if (!archived) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      return archived;
    }),

  restore: protectedProcedure
    .input(archiveAssetSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [restored] = await ctx.db
        .update(assets)
        .set({ archivedAt: null, updatedAt: new Date() })
        .where(and(eq(assets.id, input.id), eq(assets.farmId, ctx.session.user.farmId)))
        .returning();

      if (!restored) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' });
      }

      return restored;
    }),

  /** Return all active plant assets linked to a given parcel */
  getParcelCrops: protectedProcedure
    .input(z.object({ parcelId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const crops = await ctx.db
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.parentId, input.parcelId),
            eq(assets.type, 'plant'),
            eq(assets.farmId, ctx.session.user.farmId),
            isNull(assets.archivedAt),
          ),
        )
        .orderBy(desc(assets.createdAt));

      return crops;
    }),

  /** Return all active land assets for dropdown selection */
  listLandParcels: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const parcels = await ctx.db
        .select({ id: assets.id, name: assets.name })
        .from(assets)
        .where(
          and(
            eq(assets.type, 'land'),
            eq(assets.farmId, ctx.session.user.farmId),
            isNull(assets.archivedAt),
          ),
        )
        .orderBy(assets.name);

      return parcels;
    }),

  /** Return crop count per parcel for the current farm */
  cropCountByParcel: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const rows = await ctx.db
        .select({
          parcelId: assets.parentId,
          count: count(assets.id),
        })
        .from(assets)
        .where(
          and(
            eq(assets.type, 'plant'),
            eq(assets.farmId, ctx.session.user.farmId),
            isNull(assets.archivedAt),
          ),
        )
        .groupBy(assets.parentId);

      // Return as a Record<parcelId, count> for easy lookup
      const result: Record<string, number> = {};
      for (const row of rows) {
        if (row.parcelId) {
          result[row.parcelId] = row.count;
        }
      }
      return result;
    }),
});
