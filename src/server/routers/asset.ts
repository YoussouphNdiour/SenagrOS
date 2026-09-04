import { TRPCError } from '@trpc/server';
import { and, eq, ilike, isNull, sql, desc } from 'drizzle-orm';
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
});
