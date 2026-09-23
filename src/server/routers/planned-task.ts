import { TRPCError } from '@trpc/server';
import { and, eq, asc } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { plannedTasks } from '../db/schema';
import { plans } from '../db/schema';
import {
  createPlannedTaskSchema,
  updatePlannedTaskSchema,
  listPlannedTasksSchema,
  deletePlannedTaskSchema,
} from '@/lib/validators/planned-task.validator';

export const plannedTaskRouter = router({
  list: protectedProcedure
    .input(listPlannedTasksSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated' });
      }
      // Verify the plan belongs to the user's farm
      const [plan] = await ctx.db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, input.planId), eq(plans.farmId, ctx.session.user.farmId)))
        .limit(1);
      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }
      return ctx.db
        .select()
        .from(plannedTasks)
        .where(eq(plannedTasks.planId, input.planId))
        .orderBy(asc(plannedTasks.sortOrder), asc(plannedTasks.dayOffset));
    }),

  create: protectedProcedure
    .input(createPlannedTaskSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated' });
      }
      const [plan] = await ctx.db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, input.planId), eq(plans.farmId, ctx.session.user.farmId)))
        .limit(1);
      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }
      const [created] = await ctx.db
        .insert(plannedTasks)
        .values({
          planId: input.planId,
          name: input.name,
          description: input.description,
          type: input.type,
          growthStage: input.growthStage,
          recurrenceType: input.recurrenceType ?? 'none',
          recurrenceIntervalDays: input.recurrenceIntervalDays,
          dayOffset: input.dayOffset,
          plannedDate: input.plannedDate ? new Date(input.plannedDate) : null,
          duration: input.duration,
          status: input.status,
          inputs: input.inputs,
          notes: input.notes,
          sortOrder: input.sortOrder,
        })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(updatePlannedTaskSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated' });
      }
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
      if (data.plannedDate) {
        updateData.plannedDate = new Date(data.plannedDate);
      }
      const [existing] = await ctx.db
        .select({ planId: plannedTasks.planId })
        .from(plannedTasks)
        .where(eq(plannedTasks.id, id))
        .limit(1);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Planned task not found' });
      }
      const [plan] = await ctx.db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, existing.planId), eq(plans.farmId, ctx.session.user.farmId)))
        .limit(1);
      if (!plan) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      const [updated] = await ctx.db
        .update(plannedTasks)
        .set(updateData)
        .where(eq(plannedTasks.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(deletePlannedTaskSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated' });
      }
      const [existing] = await ctx.db
        .select({ planId: plannedTasks.planId })
        .from(plannedTasks)
        .where(eq(plannedTasks.id, input.id))
        .limit(1);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Planned task not found' });
      }
      const [plan] = await ctx.db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, existing.planId), eq(plans.farmId, ctx.session.user.farmId)))
        .limit(1);
      if (!plan) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      await ctx.db.delete(plannedTasks).where(eq(plannedTasks.id, input.id));
      return { success: true };
    }),
});
