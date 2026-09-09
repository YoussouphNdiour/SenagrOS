import { z } from 'zod';
import { and, eq, ilike, or } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { assets, logs, plans } from '../db/schema';

export const searchRouter = router({
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const farmId = ctx.session.user.farmId;
      if (!farmId) return { assets: [], logs: [], plans: [] };

      const q = `%${input.query}%`;

      const [assetResults, logResults, planResults] = await Promise.all([
        ctx.db
          .select({ id: assets.id, name: assets.name, type: assets.type })
          .from(assets)
          .where(
            and(
              eq(assets.farmId, farmId),
              or(ilike(assets.name, q), ilike(assets.type, q)),
            ),
          )
          .limit(5),
        ctx.db
          .select({ id: logs.id, name: logs.name, type: logs.type })
          .from(logs)
          .where(
            and(
              eq(logs.farmId, farmId),
              or(ilike(logs.name, q), ilike(logs.type, q)),
            ),
          )
          .limit(5),
        ctx.db
          .select({ id: plans.id, name: plans.name, type: plans.type })
          .from(plans)
          .where(
            and(
              eq(plans.farmId, farmId),
              or(ilike(plans.name, q), ilike(plans.type, q)),
            ),
          )
          .limit(5),
      ]);

      return { assets: assetResults, logs: logResults, plans: planResults };
    }),
});
