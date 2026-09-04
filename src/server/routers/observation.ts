import { TRPCError } from '@trpc/server';
import { and, eq, desc, gte, lte, sql, isNull } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { logs, observationForms, assets, users } from '../db/schema';
import {
  listObservationsSchema,
  getObservationByIdSchema,
  createDensitySchema,
  createStageSchema,
  createPestDiseaseSchema,
  createGradingSchema,
  updateObservationSchema,
  deleteObservationSchema,
  calculateDensity,
  calculatePestTotals,
  calculateGradingTotals,
} from '@/lib/validators/observation.validator';

function ensureFarmId(ctx: { session: { user: { farmId?: string | null } } }): string {
  if (!ctx.session.user.farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return ctx.session.user.farmId;
}

export const observationRouter = router({
  list: protectedProcedure
    .input(listObservationsSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { formType, assetId, dateFrom, dateTo, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(logs.farmId, farmId),
        eq(logs.type, 'observation'),
      ];

      // Build join conditions for observation_forms
      const formConditions = [];
      if (formType) {
        formConditions.push(eq(observationForms.formType, formType));
      }
      if (assetId) {
        formConditions.push(eq(observationForms.assetId, assetId));
      }
      if (dateFrom) {
        formConditions.push(gte(observationForms.observationDate, dateFrom));
      }
      if (dateTo) {
        formConditions.push(lte(observationForms.observationDate, dateTo));
      }

      const allFormConditions = formConditions.length > 0 ? and(...formConditions) : undefined;

      const baseQuery = ctx.db
        .select({
          id: observationForms.id,
          logId: observationForms.logId,
          formType: observationForms.formType,
          assetId: observationForms.assetId,
          cropType: observationForms.cropType,
          variety: observationForms.variety,
          observerId: observationForms.observerId,
          observationDate: observationForms.observationDate,
          startTime: observationForms.startTime,
          endTime: observationForms.endTime,
          observedSurfaceHa: observationForms.observedSurfaceHa,
          calculated: observationForms.calculated,
          observerRemarks: observationForms.observerRemarks,
          createdAt: observationForms.createdAt,
          assetName: assets.name,
          observerName: users.name,
        })
        .from(observationForms)
        .innerJoin(logs, eq(observationForms.logId, logs.id))
        .innerJoin(assets, eq(observationForms.assetId, assets.id))
        .innerJoin(users, eq(observationForms.observerId, users.id))
        .where(and(eq(logs.farmId, farmId), allFormConditions));

      const [items, countResult] = await Promise.all([
        baseQuery
          .orderBy(desc(observationForms.observationDate))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(observationForms)
          .innerJoin(logs, eq(observationForms.logId, logs.id))
          .where(and(eq(logs.farmId, farmId), allFormConditions)),
      ]);

      const total = countResult[0]?.count ?? 0;
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  getById: protectedProcedure
    .input(getObservationByIdSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [result] = await ctx.db
        .select({
          id: observationForms.id,
          logId: observationForms.logId,
          formType: observationForms.formType,
          assetId: observationForms.assetId,
          cropType: observationForms.cropType,
          variety: observationForms.variety,
          observerId: observationForms.observerId,
          supervisorId: observationForms.supervisorId,
          observationDate: observationForms.observationDate,
          startTime: observationForms.startTime,
          endTime: observationForms.endTime,
          observedSurfaceHa: observationForms.observedSurfaceHa,
          formData: observationForms.formData,
          calculated: observationForms.calculated,
          observerRemarks: observationForms.observerRemarks,
          supervisorRemarks: observationForms.supervisorRemarks,
          createdAt: observationForms.createdAt,
          updatedAt: observationForms.updatedAt,
          assetName: assets.name,
          observerName: users.name,
        })
        .from(observationForms)
        .innerJoin(logs, eq(observationForms.logId, logs.id))
        .innerJoin(assets, eq(observationForms.assetId, assets.id))
        .innerJoin(users, eq(observationForms.observerId, users.id))
        .where(and(eq(observationForms.id, input.id), eq(logs.farmId, farmId)))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Observation not found' });
      }

      return result;
    }),

  listParcels: protectedProcedure.query(async ({ ctx }) => {
    const farmId = ensureFarmId(ctx);
    const items = await ctx.db
      .select({ id: assets.id, name: assets.name })
      .from(assets)
      .where(and(eq(assets.farmId, farmId), eq(assets.type, 'land'), isNull(assets.archivedAt)))
      .orderBy(assets.name);
    return items;
  }),

  kpis: protectedProcedure.query(async ({ ctx }) => {
    const farmId = ensureFarmId(ctx);

    const [counts] = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        density: sql<number>`count(*) filter (where ${observationForms.formType} = 'emergence_density')::int`,
        stage: sql<number>`count(*) filter (where ${observationForms.formType} = 'cultural_stage')::int`,
        pest: sql<number>`count(*) filter (where ${observationForms.formType} = 'pest_disease')::int`,
        grading: sql<number>`count(*) filter (where ${observationForms.formType} = 'pre_harvest_grading')::int`,
      })
      .from(observationForms)
      .innerJoin(logs, eq(observationForms.logId, logs.id))
      .where(eq(logs.farmId, farmId));

    return {
      total: counts?.total ?? 0,
      density: counts?.density ?? 0,
      stage: counts?.stage ?? 0,
      pest: counts?.pest ?? 0,
      grading: counts?.grading ?? 0,
    };
  }),

  createDensity: protectedProcedure
    .input(createDensitySchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const userId = ctx.session.user.id;

      // Create parent log
      const [log] = await ctx.db
        .insert(logs)
        .values({
          type: 'observation',
          name: `Densité de levée — ${input.cropType}`,
          farmId,
          timestamp: new Date(input.observationDate),
          status: 'done',
          data: { observation_type: 'emergence_density' },
        })
        .returning();

      // Calculate results
      const calculated = calculateDensity({
        repetitions: input.repetitions.map((r) => ({ plantCount: r.plantCount })),
        sampleAreaM2: input.sampleAreaM2,
        theoreticalDensity: input.theoreticalDensity,
      });

      // Build form_data
      const formData = {
        num_repetitions: input.repetitions.length,
        theoretical_density: input.theoreticalDensity,
        sample_area_m2: input.sampleAreaM2,
        repetitions: input.repetitions.map((r) => ({
          rep: r.rep,
          plant_count: r.plantCount,
        })),
      };

      const [form] = await ctx.db
        .insert(observationForms)
        .values({
          logId: log.id,
          formType: 'emergence_density',
          assetId: input.assetId,
          cropType: input.cropType,
          variety: input.variety,
          observerId: userId,
          observationDate: input.observationDate,
          startTime: input.startTime,
          endTime: input.endTime,
          observedSurfaceHa: input.observedSurfaceHa?.toString(),
          formData,
          calculated: {
            total_plants: calculated.totalPlants,
            real_density_per_ha: calculated.realDensityPerHa,
            emergence_rate_pct: calculated.emergenceRatePct,
          },
          observerRemarks: input.observerRemarks,
          supervisorRemarks: input.supervisorRemarks,
        })
        .returning();

      return form;
    }),

  createStage: protectedProcedure
    .input(createStageSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const userId = ctx.session.user.id;

      const [log] = await ctx.db
        .insert(logs)
        .values({
          type: 'observation',
          name: `Stade cultural — ${input.stageReached}`,
          farmId,
          timestamp: new Date(input.observationDate),
          status: 'done',
          data: { observation_type: 'cultural_stage' },
        })
        .returning();

      const formData = {
        stage_reached: input.stageReached,
        date_reached: input.dateReached,
      };

      const [form] = await ctx.db
        .insert(observationForms)
        .values({
          logId: log.id,
          formType: 'cultural_stage',
          assetId: input.assetId,
          cropType: input.cropType,
          variety: input.variety,
          observerId: userId,
          observationDate: input.observationDate,
          startTime: input.startTime,
          endTime: input.endTime,
          observedSurfaceHa: input.observedSurfaceHa?.toString(),
          formData,
          calculated: {},
          observerRemarks: input.observerRemarks,
          supervisorRemarks: input.supervisorRemarks,
        })
        .returning();

      return form;
    }),

  createPestDisease: protectedProcedure
    .input(createPestDiseaseSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const userId = ctx.session.user.id;

      const [log] = await ctx.db
        .insert(logs)
        .values({
          type: 'observation',
          name: `Maladies-Ravageurs — ${input.cropType}`,
          farmId,
          timestamp: new Date(input.observationDate),
          status: 'done',
          data: { observation_type: 'pest_disease' },
        })
        .returning();

      // Calculate totals for each observation row
      const observationsWithCalc = input.observations.map((obs) => {
        const { total, pctInfested } = calculatePestTotals(obs.targets, input.numTargets);
        return {
          pest_or_disease: obs.pestOrDisease,
          category: obs.category,
          targets: obs.targets,
          total,
          pct_infested: pctInfested,
        };
      });

      const formData = {
        num_targets: input.numTargets,
        treatment_threshold: input.treatmentThreshold,
        observations: observationsWithCalc,
      };

      const [form] = await ctx.db
        .insert(observationForms)
        .values({
          logId: log.id,
          formType: 'pest_disease',
          assetId: input.assetId,
          cropType: input.cropType,
          variety: input.variety,
          observerId: userId,
          observationDate: input.observationDate,
          startTime: input.startTime,
          endTime: input.endTime,
          observedSurfaceHa: input.observedSurfaceHa?.toString(),
          formData,
          calculated: {},
          observerRemarks: input.observerRemarks,
          supervisorRemarks: input.supervisorRemarks,
        })
        .returning();

      return form;
    }),

  createGrading: protectedProcedure
    .input(createGradingSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const userId = ctx.session.user.id;

      const [log] = await ctx.db
        .insert(logs)
        .values({
          type: 'observation',
          name: `Agréage pré-récolte — ${input.cropType}`,
          farmId,
          timestamp: new Date(input.observationDate),
          status: 'done',
          data: { observation_type: 'pre_harvest_grading' },
        })
        .returning();

      const totalTotal = calculateGradingTotals(input.totalLengths);
      const marketableTotal = calculateGradingTotals(input.marketableLengths);
      const marketablePct = totalTotal > 0 ? (marketableTotal / totalTotal) * 100 : 0;

      const totalDefects = input.majorDefects.reduce((sum, d) => sum + d.count, 0);
      const totalDefectsPct = input.sampleSize > 0 ? (totalDefects / input.sampleSize) * 100 : 0;

      const maturityTotal =
        input.maturityIndex.matureAtDate +
        input.maturityIndex.matureAtForecast +
        input.maturityIndex.immature;
      const maturityPct =
        maturityTotal > 0
          ? (input.maturityIndex.matureAtDate / maturityTotal) * 100
          : 0;

      const formData = {
        sample_size: input.sampleSize,
        total_lengths: {
          gt_19cm: input.totalLengths.gt19cm,
          '19_16cm': input.totalLengths.from19to16cm,
          '16_14cm': input.totalLengths.from16to14cm,
          lt_14cm: input.totalLengths.lt14cm,
          total: totalTotal,
        },
        marketable_lengths: {
          gt_19cm: input.marketableLengths.gt19cm,
          '19_16cm': input.marketableLengths.from19to16cm,
          '16_14cm': input.marketableLengths.from16to14cm,
          lt_14cm: input.marketableLengths.lt14cm,
          total: marketableTotal,
        },
        marketable_pct: Math.round(marketablePct * 100) / 100,
        major_defects: input.majorDefects.map((d) => ({
          type: d.type,
          count: d.count,
          pct: input.sampleSize > 0 ? Math.round((d.count / input.sampleSize) * 100 * 100) / 100 : 0,
        })),
        total_defects_pct: Math.round(totalDefectsPct * 100) / 100,
        maturity_index: {
          mature_at_date: input.maturityIndex.matureAtDate,
          mature_at_forecast: input.maturityIndex.matureAtForecast,
          immature: input.maturityIndex.immature,
          total: maturityTotal,
          maturity_pct: Math.round(maturityPct * 100) / 100,
        },
        estimated_yield_per_ha: input.estimatedYieldPerHa,
        estimated_harvest_date: input.estimatedHarvestDate,
      };

      const [form] = await ctx.db
        .insert(observationForms)
        .values({
          logId: log.id,
          formType: 'pre_harvest_grading',
          assetId: input.assetId,
          cropType: input.cropType,
          variety: input.variety,
          observerId: userId,
          observationDate: input.observationDate,
          startTime: input.startTime,
          endTime: input.endTime,
          observedSurfaceHa: input.observedSurfaceHa?.toString(),
          formData,
          calculated: {
            marketable_pct: Math.round(marketablePct * 100) / 100,
            total_defects_pct: Math.round(totalDefectsPct * 100) / 100,
            maturity_pct: Math.round(maturityPct * 100) / 100,
          },
          observerRemarks: input.observerRemarks,
          supervisorRemarks: input.supervisorRemarks,
        })
        .returning();

      return form;
    }),

  update: protectedProcedure
    .input(updateObservationSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { id, ...updateData } = input;

      // Verify ownership via log.farmId
      const [existing] = await ctx.db
        .select({ id: observationForms.id })
        .from(observationForms)
        .innerJoin(logs, eq(observationForms.logId, logs.id))
        .where(and(eq(observationForms.id, id), eq(logs.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Observation not found' });
      }

      const [updated] = await ctx.db
        .update(observationForms)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(observationForms.id, id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(deleteObservationSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Get associated logId
      const [existing] = await ctx.db
        .select({ id: observationForms.id, logId: observationForms.logId })
        .from(observationForms)
        .innerJoin(logs, eq(observationForms.logId, logs.id))
        .where(and(eq(observationForms.id, input.id), eq(logs.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Observation not found' });
      }

      // Delete cascade: observation form then log
      await ctx.db.delete(observationForms).where(eq(observationForms.id, input.id));
      await ctx.db.delete(logs).where(eq(logs.id, existing.logId));

      return { success: true };
    }),
});
