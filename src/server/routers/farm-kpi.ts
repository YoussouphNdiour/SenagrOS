import { TRPCError } from '@trpc/server';
import { and, eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { farmKpiDefinitions, farmKpiValues } from '../db/schema/farm-kpis';

function getFarmId(ctx: { session: { user: { farmId?: string | null } } }) {
  const farmId = ctx.session.user.farmId;
  if (!farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return farmId;
}

export const farmKpiRouter = router({
  // --- Definitions CRUD ---
  listDefinitions: protectedProcedure.query(async ({ ctx }) => {
    const farmId = getFarmId(ctx);
    return ctx.db
      .select()
      .from(farmKpiDefinitions)
      .where(eq(farmKpiDefinitions.farmId, farmId))
      .orderBy(farmKpiDefinitions.category, farmKpiDefinitions.name);
  }),

  createDefinition: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        unit: z.string().max(50).optional(),
        valueType: z.enum(['number', 'percentage', 'currency']).default('number'),
        category: z.enum(['elevage', 'vegetal', 'finance', 'autre']).default('autre'),
        targetValue: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);
      const [created] = await ctx.db
        .insert(farmKpiDefinitions)
        .values({
          farmId,
          name: input.name,
          description: input.description,
          unit: input.unit,
          valueType: input.valueType,
          category: input.category,
          targetValue: input.targetValue,
        })
        .returning();
      return created;
    }),

  updateDefinition: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        unit: z.string().max(50).optional(),
        valueType: z.enum(['number', 'percentage', 'currency']).optional(),
        category: z.enum(['elevage', 'vegetal', 'finance', 'autre']).optional(),
        targetValue: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);
      const { id, ...data } = input;
      const [existing] = await ctx.db
        .select({ id: farmKpiDefinitions.id })
        .from(farmKpiDefinitions)
        .where(and(eq(farmKpiDefinitions.id, id), eq(farmKpiDefinitions.farmId, farmId)))
        .limit(1);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const [updated] = await ctx.db
        .update(farmKpiDefinitions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(farmKpiDefinitions.id, id))
        .returning();
      return updated;
    }),

  deleteDefinition: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);
      const [existing] = await ctx.db
        .select({ id: farmKpiDefinitions.id })
        .from(farmKpiDefinitions)
        .where(and(eq(farmKpiDefinitions.id, input.id), eq(farmKpiDefinitions.farmId, farmId)))
        .limit(1);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await ctx.db.delete(farmKpiDefinitions).where(eq(farmKpiDefinitions.id, input.id));
      return { success: true };
    }),

  // --- Values CRUD ---
  listValues: protectedProcedure
    .input(z.object({ kpiId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);
      return ctx.db
        .select()
        .from(farmKpiValues)
        .where(and(eq(farmKpiValues.kpiId, input.kpiId), eq(farmKpiValues.farmId, farmId)))
        .orderBy(desc(farmKpiValues.measuredAt));
    }),

  addValue: protectedProcedure
    .input(
      z.object({
        kpiId: z.string().uuid(),
        value: z.string(),
        measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);
      // Verify KPI belongs to farm
      const [kpi] = await ctx.db
        .select({ id: farmKpiDefinitions.id })
        .from(farmKpiDefinitions)
        .where(and(eq(farmKpiDefinitions.id, input.kpiId), eq(farmKpiDefinitions.farmId, farmId)))
        .limit(1);
      if (!kpi) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const [created] = await ctx.db
        .insert(farmKpiValues)
        .values({
          farmId,
          kpiId: input.kpiId,
          value: input.value,
          measuredAt: input.measuredAt,
          notes: input.notes,
        })
        .returning();
      return created;
    }),

  deleteValue: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const farmId = getFarmId(ctx);
      const [existing] = await ctx.db
        .select({ id: farmKpiValues.id })
        .from(farmKpiValues)
        .where(and(eq(farmKpiValues.id, input.id), eq(farmKpiValues.farmId, farmId)))
        .limit(1);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await ctx.db.delete(farmKpiValues).where(eq(farmKpiValues.id, input.id));
      return { success: true };
    }),
});
