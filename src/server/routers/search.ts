import { z } from 'zod';
import { and, eq, ilike, isNull } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { assets, logs, plans, farms } from '../db/schema';
import { TRPCError } from '@trpc/server';

const globalSearchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(20).optional().default(5),
});

export const searchRouter = router({
  currentFarm: protectedProcedure.query(async ({ ctx }) => {
    const farmId = ctx.session.user.farmId;
    if (!farmId) return null;

    const [farm] = await ctx.db
      .select({ id: farms.id, name: farms.name })
      .from(farms)
      .where(eq(farms.id, farmId))
      .limit(1);

    return farm ?? null;
  }),

  global: protectedProcedure
    .input(globalSearchSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ctx.session.user.farmId;
      if (!farmId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No farm associated with this account',
        });
      }

      const { query, limit } = input;
      const pattern = `%${query}%`;

      const [foundAssets, foundLogs, foundPlans] = await Promise.all([
        ctx.db
          .select({ id: assets.id, name: assets.name, type: assets.type })
          .from(assets)
          .where(
            and(
              eq(assets.farmId, farmId),
              isNull(assets.archivedAt),
              ilike(assets.name, pattern)
            )
          )
          .limit(limit),
        ctx.db
          .select({ id: logs.id, name: logs.name, type: logs.type })
          .from(logs)
          .where(
            and(
              eq(logs.farmId, farmId),
              ilike(logs.name, pattern)
            )
          )
          .limit(limit),
        ctx.db
          .select({ id: plans.id, name: plans.name, type: plans.type })
          .from(plans)
          .where(
            and(
              eq(plans.farmId, farmId),
              ilike(plans.name, pattern)
            )
          )
          .limit(limit),
      ]);

      return {
        assets: foundAssets,
        logs: foundLogs,
        plans: foundPlans,
      };
    }),
});
