import { TRPCError } from '@trpc/server';
import { and, eq, desc, sql, ilike, isNull } from 'drizzle-orm';
import crypto from 'node:crypto';
import { protectedProcedure, router } from '../trpc';
import {
  cooperatives,
  cooperativeMembers,
  cooperativeInvitations,
  farms,
  assets,
  transactions,
} from '../db/schema';
import {
  createCooperativeSchema,
  cooperativeIdSchema,
  inviteToCooperativeSchema,
  acceptInvitationSchema,
  listCooperativesSchema,
  cooperativeDashboardSchema,
} from '@/lib/validators/cooperative.validator';

function ensureFarmId(ctx: { session: { user: { farmId?: string | null } } }): string {
  if (!ctx.session.user.farmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
  }
  return ctx.session.user.farmId;
}

function ensureUserId(ctx: { session: { user: { id?: string | null } } }): string {
  if (!ctx.session.user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
  }
  return ctx.session.user.id;
}

export const cooperativeRouter = router({
  // ======== LIST cooperatives for the current user's farm ========
  list: protectedProcedure
    .input(listCooperativesSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { search, page, limit } = input;
      const offset = (page - 1) * limit;

      // Get cooperative IDs where this farm is a member
      const memberRows = await ctx.db
        .select({ cooperativeId: cooperativeMembers.cooperativeId })
        .from(cooperativeMembers)
        .where(eq(cooperativeMembers.farmId, farmId));

      const coopIds = memberRows.map((r) => r.cooperativeId);

      if (coopIds.length === 0) {
        return { items: [], total: 0, page, pages: 0 };
      }

      const conditions = [sql`${cooperatives.id} IN (${sql.join(coopIds.map((id) => sql`${id}`), sql`, `)})`];
      if (search) {
        const searchCond = ilike(cooperatives.name, `%${search}%`);
        conditions.push(searchCond);
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(cooperatives)
          .where(whereClause)
          .orderBy(desc(cooperatives.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(cooperatives)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count ?? 0;
      return { items, total, page, pages: Math.ceil(total / limit) };
    }),

  // ======== CREATE cooperative ========
  create: protectedProcedure
    .input(createCooperativeSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const userId = ensureUserId(ctx);

      const [coop] = await ctx.db
        .insert(cooperatives)
        .values({
          name: input.name,
          description: input.description,
          region: input.region,
          type: input.type,
          createdBy: userId,
        })
        .returning();

      // Add creator's farm as admin member
      await ctx.db.insert(cooperativeMembers).values({
        cooperativeId: coop.id,
        farmId,
        role: 'admin',
      });

      return coop;
    }),

  // ======== INVITE a farm to the cooperative ========
  invite: protectedProcedure
    .input(inviteToCooperativeSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const userId = ensureUserId(ctx);

      // Verify caller is admin of this cooperative
      const [membership] = await ctx.db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.farmId, farmId),
            eq(cooperativeMembers.role, 'admin'),
          ),
        );

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Seuls les administrateurs peuvent inviter des fermes',
        });
      }

      // Check farm is not already a member
      const [existing] = await ctx.db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.farmId, input.farmId),
          ),
        );

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette ferme est déjà membre de la coopérative',
        });
      }

      // Check no pending invitation
      const [pendingInvite] = await ctx.db
        .select()
        .from(cooperativeInvitations)
        .where(
          and(
            eq(cooperativeInvitations.cooperativeId, input.cooperativeId),
            eq(cooperativeInvitations.farmId, input.farmId),
            isNull(cooperativeInvitations.acceptedAt),
          ),
        );

      if (pendingInvite) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Une invitation est déjà en attente pour cette ferme',
        });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const [invitation] = await ctx.db
        .insert(cooperativeInvitations)
        .values({
          cooperativeId: input.cooperativeId,
          invitedBy: userId,
          farmId: input.farmId,
          token,
          expiresAt,
        })
        .returning();

      return invitation;
    }),

  // ======== ACCEPT invitation by token ========
  accept: protectedProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const [invitation] = await ctx.db
        .select()
        .from(cooperativeInvitations)
        .where(
          and(
            eq(cooperativeInvitations.token, input.token),
            isNull(cooperativeInvitations.acceptedAt),
          ),
        );

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation introuvable ou déjà acceptée',
        });
      }

      if (new Date() > invitation.expiresAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette invitation a expiré',
        });
      }

      // Add farm as member
      await ctx.db.insert(cooperativeMembers).values({
        cooperativeId: invitation.cooperativeId,
        farmId: invitation.farmId,
        role: 'member',
      });

      // Mark invitation as accepted
      await ctx.db
        .update(cooperativeInvitations)
        .set({ acceptedAt: new Date() })
        .where(eq(cooperativeInvitations.id, invitation.id));

      return { success: true, cooperativeId: invitation.cooperativeId };
    }),

  // ======== LIST members of a cooperative ========
  members: protectedProcedure
    .input(cooperativeIdSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Verify caller is member of this cooperative
      const [membership] = await ctx.db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.farmId, farmId),
          ),
        );

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'êtes pas membre de cette coopérative',
        });
      }

      const members = await ctx.db
        .select({
          id: cooperativeMembers.id,
          farmId: cooperativeMembers.farmId,
          farmName: farms.name,
          farmRegion: farms.description,
          role: cooperativeMembers.role,
          joinedAt: cooperativeMembers.joinedAt,
        })
        .from(cooperativeMembers)
        .innerJoin(farms, eq(cooperativeMembers.farmId, farms.id))
        .where(eq(cooperativeMembers.cooperativeId, input.cooperativeId))
        .orderBy(cooperativeMembers.joinedAt);

      return members;
    }),

  // ======== PENDING INVITATIONS for a cooperative ========
  pendingInvitations: protectedProcedure
    .input(cooperativeIdSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Verify caller is admin
      const [membership] = await ctx.db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.farmId, farmId),
            eq(cooperativeMembers.role, 'admin'),
          ),
        );

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs' });
      }

      const invitations = await ctx.db
        .select({
          id: cooperativeInvitations.id,
          farmId: cooperativeInvitations.farmId,
          farmName: farms.name,
          token: cooperativeInvitations.token,
          expiresAt: cooperativeInvitations.expiresAt,
          createdAt: cooperativeInvitations.createdAt,
        })
        .from(cooperativeInvitations)
        .innerJoin(farms, eq(cooperativeInvitations.farmId, farms.id))
        .where(
          and(
            eq(cooperativeInvitations.cooperativeId, input.cooperativeId),
            isNull(cooperativeInvitations.acceptedAt),
          ),
        )
        .orderBy(desc(cooperativeInvitations.createdAt));

      return invitations;
    }),

  // ======== COOPERATIVE DASHBOARD — aggregated KPIs ========
  dashboard: protectedProcedure
    .input(cooperativeDashboardSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Verify caller is member
      const [membership] = await ctx.db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.farmId, farmId),
          ),
        );

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'êtes pas membre de cette coopérative',
        });
      }

      // Get all member farm IDs
      const memberFarms = await ctx.db
        .select({ farmId: cooperativeMembers.farmId })
        .from(cooperativeMembers)
        .where(eq(cooperativeMembers.cooperativeId, input.cooperativeId));

      const farmIds = memberFarms.map((m) => m.farmId);

      if (farmIds.length === 0) {
        return {
          totalFarms: 0,
          totalSurfaceHa: 0,
          totalProductionKg: 0,
          totalRevenueXof: 0,
          farmDetails: [],
        };
      }

      const farmIdsSql = sql.join(farmIds.map((id) => sql`${id}`), sql`, `);

      // Aggregate surface (sum of data->>'surface_ha' from assets type=land)
      const [surfaceResult] = await ctx.db
        .select({
          total: sql<number>`COALESCE(SUM((${assets.data}->>'surface_ha')::numeric), 0)::float`,
        })
        .from(assets)
        .where(
          and(
            sql`${assets.farmId} IN (${farmIdsSql})`,
            eq(assets.type, 'land'),
            isNull(assets.archivedAt),
          ),
        );

      // Aggregate production (sum of data->>'yield_kg' from logs type=harvest)
      const { logs } = await import('../db/schema/logs');
      const [productionResult] = await ctx.db
        .select({
          total: sql<number>`COALESCE(SUM((${logs.data}->>'yield_kg')::numeric), 0)::float`,
        })
        .from(logs)
        .where(
          and(
            sql`${logs.farmId} IN (${farmIdsSql})`,
            eq(logs.type, 'harvest'),
          ),
        );

      // Aggregate revenue (sum of amount from transactions type=sale)
      const [revenueResult] = await ctx.db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)::float`,
        })
        .from(transactions)
        .where(
          and(
            sql`${transactions.farmId} IN (${farmIdsSql})`,
            eq(transactions.type, 'sale'),
          ),
        );

      // Per-farm details
      const farmDetails = await Promise.all(
        farmIds.map(async (fId) => {
          const [farm] = await ctx.db
            .select({ id: farms.id, name: farms.name })
            .from(farms)
            .where(eq(farms.id, fId));

          const [surface] = await ctx.db
            .select({
              total: sql<number>`COALESCE(SUM((${assets.data}->>'surface_ha')::numeric), 0)::float`,
            })
            .from(assets)
            .where(
              and(
                eq(assets.farmId, fId),
                eq(assets.type, 'land'),
                isNull(assets.archivedAt),
              ),
            );

          const [production] = await ctx.db
            .select({
              total: sql<number>`COALESCE(SUM((${logs.data}->>'yield_kg')::numeric), 0)::float`,
            })
            .from(logs)
            .where(and(eq(logs.farmId, fId), eq(logs.type, 'harvest')));

          const [revenue] = await ctx.db
            .select({
              total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)::float`,
            })
            .from(transactions)
            .where(and(eq(transactions.farmId, fId), eq(transactions.type, 'sale')));

          return {
            farmId: fId,
            farmName: farm?.name ?? 'Ferme inconnue',
            surfaceHa: surface?.total ?? 0,
            productionKg: production?.total ?? 0,
            revenueXof: revenue?.total ?? 0,
          };
        }),
      );

      return {
        totalFarms: farmIds.length,
        totalSurfaceHa: surfaceResult?.total ?? 0,
        totalProductionKg: productionResult?.total ?? 0,
        totalRevenueXof: revenueResult?.total ?? 0,
        farmDetails,
      };
    }),

  // ======== LIST farms available to invite (not yet members) ========
  availableFarms: protectedProcedure
    .input(cooperativeIdSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      // Verify caller is admin
      const [membership] = await ctx.db
        .select()
        .from(cooperativeMembers)
        .where(
          and(
            eq(cooperativeMembers.cooperativeId, input.cooperativeId),
            eq(cooperativeMembers.farmId, farmId),
            eq(cooperativeMembers.role, 'admin'),
          ),
        );

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs' });
      }

      // Get already-member farm IDs
      const memberRows = await ctx.db
        .select({ farmId: cooperativeMembers.farmId })
        .from(cooperativeMembers)
        .where(eq(cooperativeMembers.cooperativeId, input.cooperativeId));

      const memberFarmIds = memberRows.map((r) => r.farmId);

      // Get all farms not yet members
      const allFarms = await ctx.db
        .select({ id: farms.id, name: farms.name, description: farms.description })
        .from(farms)
        .orderBy(farms.name);

      return allFarms.filter((f) => !memberFarmIds.includes(f.id));
    }),

  // ======== LIST cooperatives' farms for FarmSwitcher ========
  myCooperativeFarms: protectedProcedure.query(async ({ ctx }) => {
    const farmId = ensureFarmId(ctx);

    // Get cooperatives where user's farm is a member
    const memberships = await ctx.db
      .select({ cooperativeId: cooperativeMembers.cooperativeId })
      .from(cooperativeMembers)
      .where(eq(cooperativeMembers.farmId, farmId));

    if (memberships.length === 0) {
      return [];
    }

    const coopIds = memberships.map((m) => m.cooperativeId);
    const coopIdsSql = sql.join(coopIds.map((id) => sql`${id}`), sql`, `);

    // Get all farms in these cooperatives (excluding current farm)
    const coopFarms = await ctx.db
      .select({
        cooperativeId: cooperativeMembers.cooperativeId,
        cooperativeName: cooperatives.name,
        farmId: cooperativeMembers.farmId,
        farmName: farms.name,
      })
      .from(cooperativeMembers)
      .innerJoin(farms, eq(cooperativeMembers.farmId, farms.id))
      .innerJoin(cooperatives, eq(cooperativeMembers.cooperativeId, cooperatives.id))
      .where(sql`${cooperativeMembers.cooperativeId} IN (${coopIdsSql})`);

    return coopFarms;
  }),
});
