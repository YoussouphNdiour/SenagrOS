import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { assets } from '../db/schema';

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
});
