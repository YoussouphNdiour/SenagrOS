import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { upsertListingSchema, upsertZoneSchema } from '@/lib/validators/storefront.validator';
import { deliveryZones, orders, priceTiers, productListings } from '../db/schema';
import { router, sellerProcedure } from '../trpc';

const idSchema = z.object({ id: z.string().uuid() });

/** Seller management of storefront listings (3-level price grid) and delivery zones. */
export const sellerCatalogRouter = router({
  listListings: sellerProcedure.query(async ({ ctx }) => {
    const listings = await ctx.db
      .select()
      .from(productListings)
      .where(and(eq(productListings.farmId, ctx.farmId), isNull(productListings.archivedAt)))
      .orderBy(desc(productListings.createdAt));
    const tiers = listings.length
      ? await ctx.db
          .select()
          .from(priceTiers)
          .where(
            inArray(
              priceTiers.listingId,
              listings.map((l) => l.id),
            ),
          )
      : [];
    return listings.map((l) => ({ ...l, tiers: tiers.filter((t) => t.listingId === l.id) }));
  }),

  upsertListing: sellerProcedure.input(upsertListingSchema).mutation(async ({ ctx, input }) => {
    const { id, tiers, harvestDate, ...fields } = input;
    const particulier = tiers.find((t) => t.buyerType === 'particulier');
    const values = {
      ...fields,
      basePrice: String(particulier?.price ?? 0),
      minOrderQuantity: String(fields.minOrderQuantity),
      stockAvailable: String(fields.stockAvailable),
      harvestDate: harvestDate || null,
      photos: fields.photos.map((p, i) => ({ ...p, order: i })),
      updatedAt: new Date(),
    };

    return ctx.db.transaction(async (tx) => {
      let listingId = id;
      if (listingId) {
        const [updated] = await tx
          .update(productListings)
          .set(values)
          .where(and(eq(productListings.id, listingId), eq(productListings.farmId, ctx.farmId)))
          .returning({ id: productListings.id });
        if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit introuvable' });
        await tx.delete(priceTiers).where(eq(priceTiers.listingId, listingId));
      } else {
        const [created] = await tx
          .insert(productListings)
          .values({ ...values, farmId: ctx.farmId, sellerId: ctx.session.user.id })
          .returning({ id: productListings.id });
        listingId = created.id;
      }
      await tx.insert(priceTiers).values(
        tiers.map((t) => ({
          listingId: listingId as string,
          buyerType: t.buyerType,
          price: String(t.price),
          minQuantity: String(t.minQuantity),
          maxQuantity: t.maxQuantity ? String(t.maxQuantity) : null,
        })),
      );
      return { id: listingId };
    });
  }),

  setPublished: sellerProcedure
    .input(idSchema.extend({ isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(productListings)
        .set({ isPublished: input.isPublished, updatedAt: new Date() })
        .where(and(eq(productListings.id, input.id), eq(productListings.farmId, ctx.farmId)))
        .returning({ id: productListings.id });
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit introuvable' });
      return updated;
    }),

  /** Soft delete: listings referenced by orders must stay. */
  archiveListing: sellerProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const [updated] = await ctx.db
      .update(productListings)
      .set({ archivedAt: new Date(), isPublished: false, updatedAt: new Date() })
      .where(and(eq(productListings.id, input.id), eq(productListings.farmId, ctx.farmId)))
      .returning({ id: productListings.id });
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit introuvable' });
    return updated;
  }),

  listZones: sellerProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.farmId, ctx.farmId))
      .orderBy(asc(deliveryZones.region), asc(deliveryZones.name)),
  ),

  upsertZone: sellerProcedure.input(upsertZoneSchema).mutation(async ({ ctx, input }) => {
    const { id, ...fields } = input;
    const values = {
      ...fields,
      deliveryFee: String(fields.deliveryFee),
      minOrderAmount: String(fields.minOrderAmount),
      updatedAt: new Date(),
    };
    if (id) {
      const [updated] = await ctx.db
        .update(deliveryZones)
        .set(values)
        .where(and(eq(deliveryZones.id, id), eq(deliveryZones.farmId, ctx.farmId)))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Zone introuvable' });
      return updated;
    }
    const [created] = await ctx.db
      .insert(deliveryZones)
      .values({ ...values, farmId: ctx.farmId })
      .returning();
    return created;
  }),

  /** Zones used by orders are deactivated instead of deleted. */
  deleteZone: sellerProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const [used] = await ctx.db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.deliveryZoneId, input.id))
      .limit(1);
    if (used) {
      await ctx.db
        .update(deliveryZones)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(deliveryZones.id, input.id), eq(deliveryZones.farmId, ctx.farmId)));
      return { deactivated: true };
    }
    await ctx.db
      .delete(deliveryZones)
      .where(and(eq(deliveryZones.id, input.id), eq(deliveryZones.farmId, ctx.farmId)));
    return { deactivated: false };
  }),
});
