import { TRPCError } from '@trpc/server';
import { and, eq, ilike, sql, desc, gte, lte, inArray } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { logs, logAssets, assets, quantities } from '../db/schema';
import {
  createLogSchema,
  updateLogSchema,
  listLogsSchema,
  getLogByIdSchema,
  deleteLogSchema,
  completeLogSchema,
} from '@/lib/validators/log.validator';

export const logRouter = router({
  list: protectedProcedure
    .input(listLogsSchema)
    .query(async ({ ctx, input }) => {
      const { type, status, search, dateFrom, dateTo, assetId, page, limit } = input;

      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const farmId = ctx.session.user.farmId;
      const offset = (page - 1) * limit;

      const conditions = [eq(logs.farmId, farmId)];

      if (type) {
        conditions.push(eq(logs.type, type));
      }

      if (status) {
        conditions.push(eq(logs.status, status));
      }

      if (search) {
        conditions.push(ilike(logs.name, `%${search}%`));
      }

      if (dateFrom) {
        conditions.push(gte(logs.timestamp, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(logs.timestamp, new Date(dateTo)));
      }

      if (assetId) {
        const linkedLogIds = ctx.db
          .select({ logId: logAssets.logId })
          .from(logAssets)
          .where(eq(logAssets.assetId, assetId));
        conditions.push(inArray(logs.id, linkedLogIds));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(logs)
          .where(where)
          .orderBy(desc(logs.timestamp))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(logs)
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
    .input(getLogByIdSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const farmId = ctx.session.user.farmId;

      const [log] = await ctx.db
        .select()
        .from(logs)
        .where(and(eq(logs.id, input.id), eq(logs.farmId, farmId)))
        .limit(1);

      if (!log) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Log not found' });
      }

      const linkedAssets = await ctx.db
        .select({
          id: assets.id,
          type: assets.type,
          name: assets.name,
          status: assets.status,
          farmId: assets.farmId,
          parentId: assets.parentId,
          notes: assets.notes,
          data: assets.data,
          flags: assets.flags,
          isLocation: assets.isLocation,
          isFixed: assets.isFixed,
          idTags: assets.idTags,
          createdAt: assets.createdAt,
          updatedAt: assets.updatedAt,
          archivedAt: assets.archivedAt,
        })
        .from(logAssets)
        .innerJoin(assets, eq(logAssets.assetId, assets.id))
        .where(eq(logAssets.logId, input.id));

      const logQuantities = await ctx.db
        .select()
        .from(quantities)
        .where(eq(quantities.logId, input.id));

      return { ...log, assets: linkedAssets, quantities: logQuantities };
    }),

  create: protectedProcedure
    .input(createLogSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const farmId = ctx.session.user.farmId;

      const [created] = await ctx.db
        .insert(logs)
        .values({
          type: input.type,
          name: input.name,
          timestamp: new Date(input.timestamp),
          status: input.status ?? 'pending',
          farmId,
          notes: input.notes,
          data: input.data ?? {},
          flags: input.flags ?? [],
          isMovement: input.isMovement ?? false,
          equipmentIds: input.equipmentIds ?? [],
          workerIds: input.workerIds ?? [],
        })
        .returning();

      if (input.assetIds && input.assetIds.length > 0) {
        await ctx.db.insert(logAssets).values(
          input.assetIds.map((a) => ({
            logId: created.id,
            assetId: a.assetId,
            role: a.role,
          })),
        );
      }

      if (input.quantities && input.quantities.length > 0) {
        await ctx.db.insert(quantities).values(
          input.quantities.map((q) => ({
            logId: created.id,
            measure: q.measure,
            numerator: q.numerator,
            denominator: q.denominator,
            unit: q.unit,
            label: q.label,
            inventoryAdjustment: q.inventoryAdjustment,
            inventoryAssetId: q.inventoryAssetId,
          })),
        );
      }

      return created;
    }),

  update: protectedProcedure
    .input(updateLogSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const { id, assetIds, quantities: inputQuantities, ...data } = input;

      const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };

      if (data.timestamp) {
        updateData.timestamp = new Date(data.timestamp);
      }

      const [updated] = await ctx.db
        .update(logs)
        .set(updateData)
        .where(and(eq(logs.id, id), eq(logs.farmId, ctx.session.user.farmId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Log not found' });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(deleteLogSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [deleted] = await ctx.db
        .delete(logs)
        .where(and(eq(logs.id, input.id), eq(logs.farmId, ctx.session.user.farmId)))
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Log not found' });
      }

      return { success: true };
    }),

  complete: protectedProcedure
    .input(completeLogSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [updated] = await ctx.db
        .update(logs)
        .set({ status: 'done', updatedAt: new Date() })
        .where(and(eq(logs.id, input.id), eq(logs.farmId, ctx.session.user.farmId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Log not found' });
      }

      return updated;
    }),
});
