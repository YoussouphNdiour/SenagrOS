import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { logs, quantities } from '../db/schema';
import { quantityInputSchema } from '@/lib/validators/log.validator';

export const quantityRouter = router({
  listByLog: protectedProcedure
    .input(z.object({ logId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [log] = await ctx.db
        .select()
        .from(logs)
        .where(and(eq(logs.id, input.logId), eq(logs.farmId, ctx.session.user.farmId)))
        .limit(1);

      if (!log) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Log not found' });
      }

      const items = await ctx.db
        .select()
        .from(quantities)
        .where(eq(quantities.logId, input.logId));

      return items;
    }),

  create: protectedProcedure
    .input(quantityInputSchema.extend({ logId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [log] = await ctx.db
        .select()
        .from(logs)
        .where(and(eq(logs.id, input.logId), eq(logs.farmId, ctx.session.user.farmId)))
        .limit(1);

      if (!log) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Log not found' });
      }

      const [created] = await ctx.db
        .insert(quantities)
        .values({
          logId: input.logId,
          measure: input.measure,
          numerator: input.numerator,
          denominator: input.denominator,
          unit: input.unit,
          label: input.label,
          inventoryAdjustment: input.inventoryAdjustment,
          inventoryAssetId: input.inventoryAssetId,
        })
        .returning();

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        measure: z.enum(['count', 'weight', 'volume', 'length', 'area', 'rate']).optional(),
        numerator: z.number().int().optional(),
        denominator: z.number().int().optional(),
        unit: z.string().max(20).optional(),
        label: z.string().max(100).optional(),
        inventoryAdjustment: z.enum(['increment', 'decrement', 'reset']).optional(),
        inventoryAssetId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      // Verify ownership: quantity -> log -> farm
      const [quantity] = await ctx.db
        .select()
        .from(quantities)
        .where(eq(quantities.id, input.id))
        .limit(1);

      if (!quantity) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quantity not found' });
      }

      const [log] = await ctx.db
        .select()
        .from(logs)
        .where(and(eq(logs.id, quantity.logId), eq(logs.farmId, ctx.session.user.farmId)))
        .limit(1);

      if (!log) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(quantities)
        .set(data)
        .where(eq(quantities.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quantity not found' });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      // Verify ownership: quantity -> log -> farm
      const [quantity] = await ctx.db
        .select()
        .from(quantities)
        .where(eq(quantities.id, input.id))
        .limit(1);

      if (!quantity) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quantity not found' });
      }

      const [log] = await ctx.db
        .select()
        .from(logs)
        .where(and(eq(logs.id, quantity.logId), eq(logs.farmId, ctx.session.user.farmId)))
        .limit(1);

      if (!log) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      await ctx.db
        .delete(quantities)
        .where(eq(quantities.id, input.id));

      return { success: true };
    }),
});
