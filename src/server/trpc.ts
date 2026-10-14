import { TRPCError, initTRPC } from '@trpc/server';
import { eq } from 'drizzle-orm';
import superjson from 'superjson';
import { auth } from './auth';
import { db } from './db';
import { buyerProfiles } from './db/schema';

export const createTRPCContext = async () => {
  const session = await auth();
  return { db, session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/** Storefront buyer: authenticated user with a buyer profile (ctx.buyer). */
export const buyerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [buyer] = await ctx.db
    .select()
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, ctx.session.user.id))
    .limit(1);
  if (!buyer) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Profil acheteur requis' });
  }
  return next({ ctx: { ...ctx, buyer } });
});

const SELLER_ROLES = ['owner', 'manager', 'worker'];

/** Storefront seller: farm member (not viewer/buyer) acting for ctx.farmId. */
export const sellerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const { farmId, role } = ctx.session.user;
  if (!farmId || !SELLER_ROLES.includes(role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès producteur requis' });
  }
  return next({ ctx: { ...ctx, farmId } });
});
