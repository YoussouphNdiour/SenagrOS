import { TRPCError } from '@trpc/server';
import { and, eq, ilike, or, sql, desc } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import {
  cropFamilies,
  crops,
  cropVarieties,
  seasons,
  cropRotationRules,
} from '../db/schema';
import {
  createCropFamilySchema,
  createCropSchema,
  createCropVarietySchema,
  createSeasonSchema,
  updateSeasonSchema,
  createRotationRuleSchema,
  listCropsSchema,
  listSeasonsSchema,
  listVarietiesSchema,
  listRotationRulesSchema,
  checkRotationSchema,
} from '@/lib/validators/crop.validator';

export const cropRouter = router({
  // --- Crop Families ---

  listFamilies: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db
      .select()
      .from(cropFamilies)
      .orderBy(cropFamilies.name);

    return items;
  }),

  createFamily: protectedProcedure
    .input(createCropFamilySchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(cropFamilies)
        .values({
          code: input.code,
          name: input.name,
          description: input.description,
        })
        .returning();

      return created;
    }),

  // --- Crops ---

  list: protectedProcedure
    .input(listCropsSchema)
    .query(async ({ ctx, input }) => {
      const { search, familyId, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(crops.nameFr, `%${search}%`),
            ilike(crops.code, `%${search}%`),
          ),
        );
      }

      if (familyId) {
        conditions.push(eq(crops.familyId, familyId));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(crops)
          .where(where)
          .orderBy(crops.nameFr)
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(crops)
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

  create: protectedProcedure
    .input(createCropSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(crops)
        .values({
          code: input.code,
          nameFr: input.nameFr,
          nameEn: input.nameEn,
          nameWo: input.nameWo,
          familyId: input.familyId,
          cycleShortDays: input.cycleShortDays,
          cycleLongDays: input.cycleLongDays,
          seasonPreference: input.seasonPreference ?? [],
          data: input.data ?? {},
        })
        .returning();

      return created;
    }),

  // --- Crop Varieties ---

  listVarieties: protectedProcedure
    .input(listVarietiesSchema)
    .query(async ({ ctx, input }) => {
      const items = await ctx.db
        .select()
        .from(cropVarieties)
        .where(eq(cropVarieties.cropId, input.cropId))
        .orderBy(cropVarieties.name);

      return items;
    }),

  createVariety: protectedProcedure
    .input(createCropVarietySchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(cropVarieties)
        .values({
          cropId: input.cropId,
          code: input.code,
          name: input.name,
          cycleDays: input.cycleDays,
          yieldPotentialKgHa: input.yieldPotentialKgHa,
          characteristics: input.characteristics ?? {},
          origin: input.origin,
        })
        .returning();

      return created;
    }),

  // --- Seasons ---

  listSeasons: protectedProcedure
    .input(listSeasonsSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const farmId = ctx.session.user.farmId;
      const { year, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(seasons.farmId, farmId)];

      if (year) {
        conditions.push(eq(seasons.year, year));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(seasons)
          .where(where)
          .orderBy(desc(seasons.startDate))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(seasons)
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

  createSeason: protectedProcedure
    .input(createSeasonSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [created] = await ctx.db
        .insert(seasons)
        .values({
          farmId: ctx.session.user.farmId,
          name: input.name,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          year: input.year,
          status: input.status ?? 'planning',
          notes: input.notes,
        })
        .returning();

      return created;
    }),

  updateSeason: protectedProcedure
    .input(updateSeasonSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(seasons)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(seasons.id, id), eq(seasons.farmId, ctx.session.user.farmId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Season not found' });
      }

      return updated;
    }),

  // --- Rotation Rules ---

  checkRotation: protectedProcedure
    .input(checkRotationSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ctx.session.user.farmId;

      const conditions = [
        eq(cropRotationRules.previousCropId, input.previousCropId),
        eq(cropRotationRules.nextCropId, input.nextCropId),
      ];

      // Check farm-specific rule first, then global
      const rules = await ctx.db
        .select()
        .from(cropRotationRules)
        .where(and(...conditions))
        .orderBy(cropRotationRules.farmId); // null (global) last

      // Prefer farm-specific rule if available
      const rule = (farmId
        ? rules.find((r) => r.farmId === farmId)
        : undefined) ?? rules.find((r) => r.farmId === null) ?? null;

      if (!rule) {
        return {
          compatibility: 'neutral' as const,
          reason: null,
          recommendation: null,
          source: 'default' as const,
        };
      }

      return {
        compatibility: rule.compatibility,
        reason: rule.reason,
        recommendation: rule.recommendation,
        source: rule.farmId ? ('farm' as const) : ('global' as const),
      };
    }),

  listRotationRules: protectedProcedure
    .input(listRotationRulesSchema)
    .query(async ({ ctx, input }) => {
      const { farmId, cropId, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (farmId) {
        conditions.push(eq(cropRotationRules.farmId, farmId));
      }

      if (cropId) {
        conditions.push(
          or(
            eq(cropRotationRules.previousCropId, cropId),
            eq(cropRotationRules.nextCropId, cropId),
          ),
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(cropRotationRules)
          .where(where)
          .orderBy(cropRotationRules.createdAt)
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(cropRotationRules)
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

  createRotationRule: protectedProcedure
    .input(createRotationRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(cropRotationRules)
        .values({
          farmId: input.farmId,
          previousCropId: input.previousCropId,
          nextCropId: input.nextCropId,
          compatibility: input.compatibility,
          reason: input.reason,
          minIntervalDays: input.minIntervalDays,
          recommendation: input.recommendation,
          data: input.data ?? {},
        })
        .returning();

      return created;
    }),
});
