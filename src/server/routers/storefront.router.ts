import { TRPCError } from '@trpc/server';
import {
  listProductsSchema,
  productIdSchema,
  quoteSchema,
} from '@/lib/validators/storefront.validator';
import { z } from 'zod';
import {
  buyerTypeForUser,
  getProduct,
  listActiveZones,
  listCategories,
  listProducers,
  listProducts,
  listRegions,
  quoteItems,
} from '../services/storefront.service';
import { publicProcedure, router } from '../trpc';

/** Public catalogue — no authentication. Prices follow the visitor's buyer profile if logged in. */
export const storefrontRouter = router({
  listProducts: publicProcedure.input(listProductsSchema).query(async ({ ctx, input }) => {
    const buyerType = await buyerTypeForUser(ctx.db, ctx.session?.user?.id);
    return listProducts(ctx.db, input, buyerType);
  }),

  getProduct: publicProcedure.input(productIdSchema).query(async ({ ctx, input }) => {
    const buyerType = await buyerTypeForUser(ctx.db, ctx.session?.user?.id);
    const product = await getProduct(ctx.db, input.id, buyerType);
    if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit introuvable' });
    return { ...product, buyerType };
  }),

  listCategories: publicProcedure.query(({ ctx }) => listCategories(ctx.db)),

  listRegions: publicProcedure.query(({ ctx }) => listRegions(ctx.db)),

  listProducers: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(6) }).optional())
    .query(({ ctx, input }) => listProducers(ctx.db, input?.limit)),

  /** Prices cart lines for the current visitor (used by the cart and checkout). */
  quote: publicProcedure.input(quoteSchema).query(async ({ ctx, input }) => {
    const buyerType = await buyerTypeForUser(ctx.db, ctx.session?.user?.id);
    const quote = await quoteItems(ctx.db, input.items, buyerType);
    return { ...quote, buyerType };
  }),

  /** Active delivery zones of the given seller farms. */
  listZones: publicProcedure
    .input(z.object({ farmIds: z.array(z.string().uuid()).max(20) }))
    .query(({ ctx, input }) => listActiveZones(ctx.db, input.farmIds)),
});
