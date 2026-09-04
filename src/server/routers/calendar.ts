import { TRPCError } from '@trpc/server';
import { and, eq, desc, gte, lte, sql, isNull, ilike, or } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { culturalCalendars, parcelCalendars } from '../db/schema';
import { assets } from '../db/schema';
import {
  listTemplatesSchema,
  createTemplateSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
  listParcelCalendarsSchema,
  assignToParcelSchema,
  updateStageStatusSchema,
  getTimelineSchema,
  calculateExpectedDates,
  calculateTotalDays,
} from '@/lib/validators/calendar.validator';
import type { Stage, StageStatus } from '@/lib/validators/calendar.validator';

function ensureFarmId(ctx: { session: { user: { farmId?: string | null } } }): string {
  if (!ctx.session.user.farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return ctx.session.user.farmId;
}

export const calendarRouter = router({
  // --- Templates ---

  listTemplates: protectedProcedure
    .input(listTemplatesSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { cropType, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(culturalCalendars.farmId, farmId)];
      if (cropType) {
        conditions.push(eq(culturalCalendars.cropType, cropType));
      }
      if (search) {
        const searchCondition = or(
          ilike(culturalCalendars.name, `%${search}%`),
          ilike(culturalCalendars.cropType, `%${search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(culturalCalendars)
          .where(whereClause)
          .orderBy(desc(culturalCalendars.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(culturalCalendars)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count ?? 0;
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  getTemplate: protectedProcedure
    .input(deleteTemplateSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [result] = await ctx.db
        .select()
        .from(culturalCalendars)
        .where(and(eq(culturalCalendars.id, input.id), eq(culturalCalendars.farmId, farmId)))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Calendar template not found' });
      }

      return result;
    }),

  createTemplate: protectedProcedure
    .input(createTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const totalDays = input.totalDays ?? calculateTotalDays(input.stages);

      const [template] = await ctx.db
        .insert(culturalCalendars)
        .values({
          farmId,
          name: input.name,
          cropType: input.cropType,
          variety: input.variety,
          stages: input.stages,
          totalDays,
          notes: input.notes,
        })
        .returning();

      return template;
    }),

  updateTemplate: protectedProcedure
    .input(updateTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { id, ...updateData } = input;

      const [existing] = await ctx.db
        .select({ id: culturalCalendars.id })
        .from(culturalCalendars)
        .where(and(eq(culturalCalendars.id, id), eq(culturalCalendars.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Calendar template not found' });
      }

      // Recalculate totalDays if stages changed
      const values: Record<string, unknown> = { ...updateData, updatedAt: new Date() };
      if (updateData.stages) {
        values.totalDays = updateData.totalDays ?? calculateTotalDays(updateData.stages);
      }

      const [updated] = await ctx.db
        .update(culturalCalendars)
        .set(values)
        .where(eq(culturalCalendars.id, id))
        .returning();

      return updated;
    }),

  deleteTemplate: protectedProcedure
    .input(deleteTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [existing] = await ctx.db
        .select({ id: culturalCalendars.id })
        .from(culturalCalendars)
        .where(and(eq(culturalCalendars.id, input.id), eq(culturalCalendars.farmId, farmId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Calendar template not found' });
      }

      await ctx.db.delete(culturalCalendars).where(eq(culturalCalendars.id, input.id));
      return { success: true };
    }),

  // --- Parcel Calendars ---

  listParcelCalendars: protectedProcedure
    .input(listParcelCalendarsSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { assetId, status, dateFrom, dateTo, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(parcelCalendars.farmId, farmId)];
      if (assetId) conditions.push(eq(parcelCalendars.assetId, assetId));
      if (status) conditions.push(eq(parcelCalendars.status, status));
      if (dateFrom) conditions.push(gte(parcelCalendars.sowingDate, dateFrom));
      if (dateTo) conditions.push(lte(parcelCalendars.sowingDate, dateTo));

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select({
            id: parcelCalendars.id,
            farmId: parcelCalendars.farmId,
            assetId: parcelCalendars.assetId,
            calendarId: parcelCalendars.calendarId,
            sowingDate: parcelCalendars.sowingDate,
            stageStatuses: parcelCalendars.stageStatuses,
            status: parcelCalendars.status,
            notes: parcelCalendars.notes,
            createdAt: parcelCalendars.createdAt,
            assetName: assets.name,
            calendarName: culturalCalendars.name,
            cropType: culturalCalendars.cropType,
            variety: culturalCalendars.variety,
          })
          .from(parcelCalendars)
          .innerJoin(assets, eq(parcelCalendars.assetId, assets.id))
          .innerJoin(culturalCalendars, eq(parcelCalendars.calendarId, culturalCalendars.id))
          .where(whereClause)
          .orderBy(desc(parcelCalendars.sowingDate))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(parcelCalendars)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count ?? 0;
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  assignToParcel: protectedProcedure
    .input(assignToParcelSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Verify the calendar template exists and belongs to this farm
      const [calendar] = await ctx.db
        .select()
        .from(culturalCalendars)
        .where(and(eq(culturalCalendars.id, input.calendarId), eq(culturalCalendars.farmId, farmId)))
        .limit(1);

      if (!calendar) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Calendar template not found' });
      }

      // Verify the parcel exists and belongs to this farm
      const [parcel] = await ctx.db
        .select({ id: assets.id })
        .from(assets)
        .where(
          and(
            eq(assets.id, input.assetId),
            eq(assets.farmId, farmId),
            eq(assets.type, 'land'),
            isNull(assets.archivedAt),
          ),
        )
        .limit(1);

      if (!parcel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parcel not found' });
      }

      // Calculate expected dates from sowing date + stage durations
      const stages = calendar.stages as Stage[];
      const stageStatuses = calculateExpectedDates(input.sowingDate, stages);

      const [parcelCalendar] = await ctx.db
        .insert(parcelCalendars)
        .values({
          farmId,
          assetId: input.assetId,
          calendarId: input.calendarId,
          sowingDate: input.sowingDate,
          stageStatuses,
          status: 'active',
          notes: input.notes,
        })
        .returning();

      return parcelCalendar;
    }),

  updateStageStatus: protectedProcedure
    .input(updateStageStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [existing] = await ctx.db
        .select()
        .from(parcelCalendars)
        .where(
          and(
            eq(parcelCalendars.id, input.parcelCalendarId),
            eq(parcelCalendars.farmId, farmId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parcel calendar not found' });
      }

      const statuses = (existing.stageStatuses as StageStatus[]) ?? [];
      let foundIndex = -1;

      const updatedStatuses = statuses.map((s, i) => {
        if (s.stageName === input.stageName) {
          foundIndex = i;
          return {
            ...s,
            actualDate: input.actualDate,
            status: input.status,
          };
        }
        return s;
      });

      if (foundIndex === -1) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Stage "${input.stageName}" not found` });
      }

      // Set next stage to "in_progress" if current was completed
      if (input.status === 'completed' && foundIndex + 1 < updatedStatuses.length) {
        const next = updatedStatuses[foundIndex + 1];
        if (next.status === 'pending') {
          updatedStatuses[foundIndex + 1] = { ...next, status: 'in_progress' };
        }
      }

      // Check if all stages are completed/skipped
      const allDone = updatedStatuses.every((s) => s.status === 'completed' || s.status === 'skipped');
      const newStatus = allDone ? 'completed' : 'active';

      const [updated] = await ctx.db
        .update(parcelCalendars)
        .set({
          stageStatuses: updatedStatuses,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(parcelCalendars.id, input.parcelCalendarId))
        .returning();

      return updated;
    }),

  // --- Timeline ---

  getTimeline: protectedProcedure
    .input(getTimelineSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const conditions = [eq(parcelCalendars.farmId, farmId)];
      if (input.status) conditions.push(eq(parcelCalendars.status, input.status));
      if (input.dateFrom) conditions.push(gte(parcelCalendars.sowingDate, input.dateFrom));
      if (input.dateTo) conditions.push(lte(parcelCalendars.sowingDate, input.dateTo));
      if (input.cropType) conditions.push(eq(culturalCalendars.cropType, input.cropType));

      const items = await ctx.db
        .select({
          id: parcelCalendars.id,
          assetId: parcelCalendars.assetId,
          calendarId: parcelCalendars.calendarId,
          sowingDate: parcelCalendars.sowingDate,
          stageStatuses: parcelCalendars.stageStatuses,
          status: parcelCalendars.status,
          assetName: assets.name,
          calendarName: culturalCalendars.name,
          cropType: culturalCalendars.cropType,
          variety: culturalCalendars.variety,
          totalDays: culturalCalendars.totalDays,
        })
        .from(parcelCalendars)
        .innerJoin(assets, eq(parcelCalendars.assetId, assets.id))
        .innerJoin(culturalCalendars, eq(parcelCalendars.calendarId, culturalCalendars.id))
        .where(and(...conditions))
        .orderBy(assets.name);

      return items;
    }),

  // --- KPIs ---

  kpis: protectedProcedure.query(async ({ ctx }) => {
    const farmId = ensureFarmId(ctx);

    const [counts] = await ctx.db
      .select({
        totalTemplates: sql<number>`count(distinct ${culturalCalendars.id})::int`,
      })
      .from(culturalCalendars)
      .where(eq(culturalCalendars.farmId, farmId));

    const [parcelCounts] = await ctx.db
      .select({
        totalAssigned: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${parcelCalendars.status} = 'active')::int`,
        completed: sql<number>`count(*) filter (where ${parcelCalendars.status} = 'completed')::int`,
      })
      .from(parcelCalendars)
      .where(eq(parcelCalendars.farmId, farmId));

    return {
      totalTemplates: counts?.totalTemplates ?? 0,
      totalAssigned: parcelCounts?.totalAssigned ?? 0,
      active: parcelCounts?.active ?? 0,
      completed: parcelCounts?.completed ?? 0,
    };
  }),

  // --- List parcels (for assignment form) ---

  listParcels: protectedProcedure.query(async ({ ctx }) => {
    const farmId = ensureFarmId(ctx);
    const items = await ctx.db
      .select({ id: assets.id, name: assets.name })
      .from(assets)
      .where(and(eq(assets.farmId, farmId), eq(assets.type, 'land'), isNull(assets.archivedAt)))
      .orderBy(assets.name);
    return items;
  }),
});
