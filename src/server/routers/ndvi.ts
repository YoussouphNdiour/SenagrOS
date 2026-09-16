import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { fetchNdviTimeSeries } from '@/lib/sentinel-hub';
import { assets } from '../db/schema';

export const ndviRouter = router({
  getTimeSeries: protectedProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        months: z.number().min(1).max(24).default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const farmId = ctx.session.user.farmId;
      if (!farmId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No farm associated with this account',
        });
      }

      // Fetch the asset and verify it belongs to this farm
      const [asset] = await ctx.db
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.id, input.assetId),
            eq(assets.farmId, farmId),
            isNull(assets.archivedAt),
          ),
        )
        .limit(1);

      if (!asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Parcelle introuvable',
        });
      }

      // Verify it's a land-type asset
      if (asset.type !== 'land') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NDVI is only available for land assets',
        });
      }

      // Extract polygon coordinates from asset data
      const assetData = asset.data as Record<string, unknown> | null;
      const coordinates = assetData?.coordinates as number[][][] | undefined;

      if (!coordinates || coordinates.length === 0) {
        return { data: [], hasGeometry: false };
      }

      // Calculate date range
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - input.months);

      const fromISO = fromDate.toISOString();
      const toISO = toDate.toISOString();

      const data = await fetchNdviTimeSeries(coordinates, fromISO, toISO);

      return { data, hasGeometry: true };
    }),
});
