import { z } from 'zod';
import { and, eq, ilike } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { farmMembers, farmInvitations } from '../db/schema/farm-members';
import { users } from '../db/schema/users';

function generateToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const farmMemberRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const farmId = ctx.session.user.farmId;
      if (!farmId) return { items: [] };

      const results = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: farmMembers.role,
        })
        .from(farmMembers)
        .innerJoin(users, eq(farmMembers.userId, users.id))
        .where(
          input.search
            ? and(
                eq(farmMembers.farmId, farmId),
                ilike(users.name, `%${input.search}%`),
              )
            : eq(farmMembers.farmId, farmId),
        );

      return { items: results };
    }),

  invite: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = ctx.session.user.farmId;
      if (!farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const token = generateToken(8);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const [invitation] = await ctx.db
        .insert(farmInvitations)
        .values({
          farmId,
          invitedBy: ctx.session.user.id,
          email: input.email,
          role: input.role,
          token,
          expiresAt,
        })
        .returning();

      return invitation;
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = ctx.session.user.farmId;
      if (!farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      const [updated] = await ctx.db
        .update(farmMembers)
        .set({ role: input.role })
        .where(
          and(
            eq(farmMembers.farmId, farmId),
            eq(farmMembers.userId, input.userId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      }

      return updated;
    }),

  remove: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = ctx.session.user.farmId;
      if (!farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No farm associated with this account' });
      }

      // Prevent removing yourself
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot remove yourself' });
      }

      const [deleted] = await ctx.db
        .delete(farmMembers)
        .where(
          and(
            eq(farmMembers.farmId, farmId),
            eq(farmMembers.userId, input.userId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      }

      return { success: true };
    }),
});
