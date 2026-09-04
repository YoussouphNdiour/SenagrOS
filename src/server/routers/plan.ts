import { TRPCError } from '@trpc/server';
import { and, eq, desc, sql, ilike, or } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { plans, planLogs } from '../db/schema';
import { logs } from '../db/schema';
import {
  listPlansSchema,
  createPlanSchema,
  updatePlanSchema,
  planIdSchema,
  planLogSchema,
} from '@/lib/validators/plan.validator';

function ensureFarmId(ctx: { session: { user: { farmId?: string | null } } }): string {
  if (!ctx.session.user.farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return ctx.session.user.farmId;
}

export const planRouter = router({
  list: protectedProcedure
    .input(listPlansSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { type, status, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(plans.farmId, farmId)];
      if (type) conditions.push(eq(plans.type, type));
      if (status) conditions.push(eq(plans.status, status));
      if (search) {
        const searchCondition = or(
          ilike(plans.name, `%${search}%`),
          ilike(plans.season, `%${search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(plans)
          .where(whereClause)
          .orderBy(desc(plans.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(plans)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count ?? 0;
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  getById: protectedProcedure
    .input(planIdSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [plan] = await ctx.db
        .select()
        .from(plans)
        .where(and(eq(plans.id, input.id), eq(plans.farmId, farmId)))
        .limit(1);

      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      // Fetch associated logs via plan_logs pivot
      const associatedLogs = await ctx.db
        .select({
          id: logs.id,
          name: logs.name,
          type: logs.type,
          status: logs.status,
          timestamp: logs.timestamp,
          notes: logs.notes,
        })
        .from(planLogs)
        .innerJoin(logs, eq(planLogs.logId, logs.id))
        .where(eq(planLogs.planId, plan.id))
        .orderBy(desc(logs.timestamp));

      return { ...plan, logs: associatedLogs };
    }),

  kpis: protectedProcedure
    .query(async ({ ctx }) => {
      const farmId = ensureFarmId(ctx);

      const allPlans = await ctx.db
        .select({
          status: plans.status,
        })
        .from(plans)
        .where(eq(plans.farmId, farmId));

      const total = allPlans.length;
      const active = allPlans.filter((p) => p.status === 'active').length;
      const completed = allPlans.filter((p) => p.status === 'completed').length;
      const cancelled = allPlans.filter((p) => p.status === 'cancelled').length;

      return { total, active, completed, cancelled };
    }),

  create: protectedProcedure
    .input(createPlanSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [plan] = await ctx.db
        .insert(plans)
        .values({
          farmId,
          name: input.name,
          type: input.type,
          season: input.season,
          startDate: input.startDate,
          endDate: input.endDate,
          notes: input.notes,
        })
        .returning();

      return plan;
    }),

  update: protectedProcedure
    .input(updatePlanSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { id, ...updateData } = input;

      const [existing] = await ctx.db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, id), eq(plans.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      const [updated] = await ctx.db
        .update(plans)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(plans.id, id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(planIdSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [existing] = await ctx.db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, input.id), eq(plans.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      // Delete associated plan_logs first (cascade should handle, but explicit)
      await ctx.db.delete(planLogs).where(eq(planLogs.planId, input.id));
      await ctx.db.delete(plans).where(eq(plans.id, input.id));

      return { success: true };
    }),

  addLog: protectedProcedure
    .input(planLogSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Verify plan belongs to farm
      const [plan] = await ctx.db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, input.planId), eq(plans.farmId, farmId)))
        .limit(1);

      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      // Verify log belongs to farm
      const [log] = await ctx.db
        .select({ id: logs.id })
        .from(logs)
        .where(and(eq(logs.id, input.logId), eq(logs.farmId, farmId)))
        .limit(1);

      if (!log) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Log not found' });
      }

      // Check if already associated
      const [existing] = await ctx.db
        .select()
        .from(planLogs)
        .where(and(eq(planLogs.planId, input.planId), eq(planLogs.logId, input.logId)))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Log already associated to this plan' });
      }

      await ctx.db.insert(planLogs).values({
        planId: input.planId,
        logId: input.logId,
      });

      return { success: true };
    }),

  removeLog: protectedProcedure
    .input(planLogSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Verify plan belongs to farm
      const [plan] = await ctx.db
        .select({ id: plans.id })
        .from(plans)
        .where(and(eq(plans.id, input.planId), eq(plans.farmId, farmId)))
        .limit(1);

      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });
      }

      await ctx.db
        .delete(planLogs)
        .where(and(eq(planLogs.planId, input.planId), eq(planLogs.logId, input.logId)));

      return { success: true };
    }),
});
