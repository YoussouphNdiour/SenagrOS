import { eq, and, desc, count } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { notifications } from '../db/schema';
import { listNotificationsSchema, markReadSchema } from '@/lib/validators/notification.validator';

export const notificationRouter = router({
  list: protectedProcedure
    .input(listNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const farmId = ctx.session.user.farmId;
      if (!farmId) return { items: [], total: 0 };

      const conditions = [
        eq(notifications.userId, userId),
        eq(notifications.farmId, farmId),
      ];
      if (input.unreadOnly) conditions.push(eq(notifications.read, false));

      const items = await ctx.db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ value: total }] = await ctx.db
        .select({ value: count() })
        .from(notifications)
        .where(and(...conditions));

      return { items, total: Number(total) };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const farmId = ctx.session.user.farmId;
    if (!farmId) return 0;

    const [{ value }] = await ctx.db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.farmId, farmId),
          eq(notifications.read, false),
        ),
      );
    return Number(value);
  }),

  markRead: protectedProcedure
    .input(markReadSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id),
          ),
        );
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const farmId = ctx.session.user.farmId;
    if (!farmId) return { success: true };

    await ctx.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.farmId, farmId),
          eq(notifications.read, false),
        ),
      );
    return { success: true };
  }),
});
