import { z } from 'zod';
import { and, eq, ilike } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { farmMembers } from '../db/schema/farm-members';
import { users } from '../db/schema/users';

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
});
