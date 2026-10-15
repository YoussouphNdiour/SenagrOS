import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { fetchRainfallForecast, fetchRainfallHistory } from '@/lib/weather';
import { assets, farms } from '../db/schema';

export const weatherRouter = router({
  /**
   * Pluviometrie d'une parcelle : historique + previsions a 7 jours.
   *
   * Le point de mesure est le centroide de la parcelle quand sa geometrie est
   * connue, sinon les coordonnees de la ferme. La maille ERA5 fait environ
   * 11 km, donc l'ecart entre les deux est le plus souvent sans effet, mais
   * le centroide reste correct pour une ferme etendue.
   */
  getRainfall: protectedProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        days: z.number().min(7).max(365).default(90),
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

      const [asset] = await ctx.db
        .select({
          id: assets.id,
          type: assets.type,
          lat: sql<number | null>`ST_Y(ST_Centroid(${assets.geometry}))`.as('lat'),
          lng: sql<number | null>`ST_X(ST_Centroid(${assets.geometry}))`.as('lng'),
        })
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parcelle introuvable' });
      }

      let latitude = asset.lat;
      let longitude = asset.lng;
      let origin: 'parcel' | 'farm' = 'parcel';

      if (latitude == null || longitude == null) {
        const [farm] = await ctx.db
          .select({ latitude: farms.latitude, longitude: farms.longitude })
          .from(farms)
          .where(eq(farms.id, farmId))
          .limit(1);

        const farmLat = farm?.latitude ? Number.parseFloat(farm.latitude) : Number.NaN;
        const farmLng = farm?.longitude ? Number.parseFloat(farm.longitude) : Number.NaN;
        if (Number.isNaN(farmLat) || Number.isNaN(farmLng)) {
          return { history: [], forecast: [], origin: null };
        }
        latitude = farmLat;
        longitude = farmLng;
        origin = 'farm';
      }

      const [history, forecast] = await Promise.all([
        fetchRainfallHistory(latitude, longitude, input.days),
        fetchRainfallForecast(latitude, longitude),
      ]);

      return { history, forecast, origin };
    }),
});
