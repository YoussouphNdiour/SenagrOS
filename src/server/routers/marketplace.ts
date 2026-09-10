import { TRPCError } from '@trpc/server';
import { and, eq, desc, sql, ilike, isNull, gte, lte, gt } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import {
  marketplaceProducts,
  marketplaceOrders,
  farms,
  users,
} from '../db/schema';
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  listProductsSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  listOrdersSchema,
} from '@/lib/validators/marketplace.validator';

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

export const marketplaceRouter = router({
  // ======== MARKETPLACE (Buyer view — all published products) ========

  listAll: protectedProcedure
    .input(listProductsSchema)
    .query(async ({ ctx, input }) => {
      const { search, category, minPrice, maxPrice, bioOnly, inStockOnly, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(marketplaceProducts.isPublished, true),
        isNull(marketplaceProducts.archivedAt),
      ];

      if (search) {
        conditions.push(ilike(marketplaceProducts.name, `%${search}%`));
      }
      if (category) {
        conditions.push(eq(marketplaceProducts.category, category));
      }
      if (minPrice !== undefined) {
        conditions.push(gte(marketplaceProducts.pricePerKg, String(minPrice)));
      }
      if (maxPrice !== undefined) {
        conditions.push(lte(marketplaceProducts.pricePerKg, String(maxPrice)));
      }
      if (bioOnly) {
        conditions.push(eq(marketplaceProducts.isBio, true));
      }
      if (inStockOnly) {
        conditions.push(gt(marketplaceProducts.quantityAvailable, '0'));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select({
            id: marketplaceProducts.id,
            name: marketplaceProducts.name,
            description: marketplaceProducts.description,
            category: marketplaceProducts.category,
            photoUrl: marketplaceProducts.photoUrl,
            pricePerKg: marketplaceProducts.pricePerKg,
            quantityAvailable: marketplaceProducts.quantityAvailable,
            unit: marketplaceProducts.unit,
            location: marketplaceProducts.location,
            isBio: marketplaceProducts.isBio,
            createdAt: marketplaceProducts.createdAt,
            farmName: farms.name,
            sellerName: users.name,
          })
          .from(marketplaceProducts)
          .leftJoin(farms, eq(marketplaceProducts.farmId, farms.id))
          .leftJoin(users, eq(marketplaceProducts.sellerId, users.id))
          .where(where)
          .orderBy(desc(marketplaceProducts.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(marketplaceProducts)
          .where(where),
      ]);

      return {
        items,
        total: Number(countResult[0]?.count ?? 0),
        page,
        limit,
      };
    }),

  // ======== MY PRODUCTS (Seller view) ========

  listMyProducts: protectedProcedure
    .input(listProductsSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { search, category, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [
        eq(marketplaceProducts.farmId, farmId),
        isNull(marketplaceProducts.archivedAt),
      ];

      if (search) {
        conditions.push(ilike(marketplaceProducts.name, `%${search}%`));
      }
      if (category) {
        conditions.push(eq(marketplaceProducts.category, category));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(marketplaceProducts)
          .where(where)
          .orderBy(desc(marketplaceProducts.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(marketplaceProducts)
          .where(where),
      ]);

      return {
        items,
        total: Number(countResult[0]?.count ?? 0),
        page,
        limit,
      };
    }),

  // ======== GET PRODUCT ========

  getProduct: protectedProcedure
    .input(productIdSchema)
    .query(async ({ ctx, input }) => {
      const [product] = await ctx.db
        .select({
          id: marketplaceProducts.id,
          farmId: marketplaceProducts.farmId,
          sellerId: marketplaceProducts.sellerId,
          name: marketplaceProducts.name,
          description: marketplaceProducts.description,
          category: marketplaceProducts.category,
          photoUrl: marketplaceProducts.photoUrl,
          pricePerKg: marketplaceProducts.pricePerKg,
          quantityAvailable: marketplaceProducts.quantityAvailable,
          unit: marketplaceProducts.unit,
          location: marketplaceProducts.location,
          isBio: marketplaceProducts.isBio,
          isPublished: marketplaceProducts.isPublished,
          createdAt: marketplaceProducts.createdAt,
          farmName: farms.name,
          sellerName: users.name,
        })
        .from(marketplaceProducts)
        .leftJoin(farms, eq(marketplaceProducts.farmId, farms.id))
        .leftJoin(users, eq(marketplaceProducts.sellerId, users.id))
        .where(eq(marketplaceProducts.id, input.productId));

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit introuvable' });
      }

      return product;
    }),

  // ======== CREATE PRODUCT ========

  createProduct: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const userId = ensureUserId(ctx);

      const [product] = await ctx.db
        .insert(marketplaceProducts)
        .values({
          farmId,
          sellerId: userId,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          photoUrl: input.photoUrl || null,
          pricePerKg: String(input.pricePerKg),
          quantityAvailable: String(input.quantityAvailable),
          unit: input.unit,
          location: input.location ?? null,
          isBio: input.isBio,
          assetId: input.assetId ?? null,
        })
        .returning();

      return product;
    }),

  // ======== UPDATE PRODUCT ========

  updateProduct: protectedProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { id, ...updates } = input;

      // Verify ownership
      const [existing] = await ctx.db
        .select({ farmId: marketplaceProducts.farmId })
        .from(marketplaceProducts)
        .where(eq(marketplaceProducts.id, id));

      if (!existing || existing.farmId !== farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vous ne pouvez modifier que vos propres produits' });
      }

      const setValues: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.name !== undefined) setValues.name = updates.name;
      if (updates.description !== undefined) setValues.description = updates.description;
      if (updates.category !== undefined) setValues.category = updates.category;
      if (updates.photoUrl !== undefined) setValues.photoUrl = updates.photoUrl || null;
      if (updates.pricePerKg !== undefined) setValues.pricePerKg = String(updates.pricePerKg);
      if (updates.quantityAvailable !== undefined) setValues.quantityAvailable = String(updates.quantityAvailable);
      if (updates.unit !== undefined) setValues.unit = updates.unit;
      if (updates.location !== undefined) setValues.location = updates.location;
      if (updates.isBio !== undefined) setValues.isBio = updates.isBio;
      if (updates.isPublished !== undefined) setValues.isPublished = updates.isPublished;

      const [updated] = await ctx.db
        .update(marketplaceProducts)
        .set(setValues)
        .where(eq(marketplaceProducts.id, id))
        .returning();

      return updated;
    }),

  // ======== DELETE (archive) PRODUCT ========

  deleteProduct: protectedProcedure
    .input(productIdSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [existing] = await ctx.db
        .select({ farmId: marketplaceProducts.farmId })
        .from(marketplaceProducts)
        .where(eq(marketplaceProducts.id, input.productId));

      if (!existing || existing.farmId !== farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vous ne pouvez supprimer que vos propres produits' });
      }

      await ctx.db
        .update(marketplaceProducts)
        .set({ archivedAt: new Date(), isPublished: false })
        .where(eq(marketplaceProducts.id, input.productId));

      return { success: true };
    }),

  // ======== KPIs (seller) ========

  sellerKpis: protectedProcedure.query(async ({ ctx }) => {
    const farmId = ensureFarmId(ctx);

    const [productStats] = await ctx.db
      .select({
        totalProducts: sql<number>`count(*)`,
        publishedProducts: sql<number>`count(*) filter (where ${marketplaceProducts.isPublished} = true)`,
      })
      .from(marketplaceProducts)
      .where(and(eq(marketplaceProducts.farmId, farmId), isNull(marketplaceProducts.archivedAt)));

    const [orderStats] = await ctx.db
      .select({
        totalOrders: sql<number>`count(*)`,
        pendingOrders: sql<number>`count(*) filter (where ${marketplaceOrders.status} = 'pending')`,
        totalRevenue: sql<number>`coalesce(sum(${marketplaceOrders.totalAmount}::numeric) filter (where ${marketplaceOrders.status} in ('confirmed', 'shipped', 'delivered')), 0)`,
      })
      .from(marketplaceOrders)
      .where(eq(marketplaceOrders.sellerFarmId, farmId));

    return {
      totalProducts: Number(productStats?.totalProducts ?? 0),
      publishedProducts: Number(productStats?.publishedProducts ?? 0),
      totalOrders: Number(orderStats?.totalOrders ?? 0),
      pendingOrders: Number(orderStats?.pendingOrders ?? 0),
      totalRevenue: Number(orderStats?.totalRevenue ?? 0),
    };
  }),

  // ======== KPIs (marketplace) ========

  marketplaceKpis: protectedProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db
      .select({
        totalProducts: sql<number>`count(*)`,
        totalFarms: sql<number>`count(distinct ${marketplaceProducts.farmId})`,
        bioProducts: sql<number>`count(*) filter (where ${marketplaceProducts.isBio} = true)`,
      })
      .from(marketplaceProducts)
      .where(and(eq(marketplaceProducts.isPublished, true), isNull(marketplaceProducts.archivedAt)));

    return {
      totalProducts: Number(stats?.totalProducts ?? 0),
      totalFarms: Number(stats?.totalFarms ?? 0),
      bioProducts: Number(stats?.bioProducts ?? 0),
    };
  }),

  // ======== CREATE ORDER (buyer) ========

  createOrder: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const buyerFarmId = ensureFarmId(ctx);
      const buyerId = ensureUserId(ctx);

      // Get the product
      const [product] = await ctx.db
        .select()
        .from(marketplaceProducts)
        .where(
          and(
            eq(marketplaceProducts.id, input.productId),
            eq(marketplaceProducts.isPublished, true),
            isNull(marketplaceProducts.archivedAt),
          ),
        );

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit introuvable ou non disponible' });
      }

      if (product.farmId === buyerFarmId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous ne pouvez pas commander votre propre produit' });
      }

      const available = Number(product.quantityAvailable);
      if (input.quantity > available) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Stock insuffisant. Disponible : ${available} ${product.unit}`,
        });
      }

      const unitPrice = Number(product.pricePerKg);
      const totalAmount = input.quantity * unitPrice;

      const [order] = await ctx.db
        .insert(marketplaceOrders)
        .values({
          productId: input.productId,
          buyerId,
          buyerFarmId,
          sellerFarmId: product.farmId,
          quantity: String(input.quantity),
          unitPrice: String(unitPrice),
          totalAmount: String(totalAmount),
          status: 'pending',
          deliveryMethod: input.deliveryMethod,
          deliveryAddress: input.deliveryAddress ?? null,
          notes: input.notes ?? null,
        })
        .returning();

      // Decrement available quantity
      await ctx.db
        .update(marketplaceProducts)
        .set({
          quantityAvailable: String(available - input.quantity),
          updatedAt: new Date(),
        })
        .where(eq(marketplaceProducts.id, input.productId));

      return order;
    }),

  // ======== UPDATE ORDER STATUS (seller) ========

  updateOrderStatus: protectedProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);

      const [existing] = await ctx.db
        .select({ sellerFarmId: marketplaceOrders.sellerFarmId, status: marketplaceOrders.status })
        .from(marketplaceOrders)
        .where(eq(marketplaceOrders.id, input.orderId));

      if (!existing || existing.sellerFarmId !== farmId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vous ne pouvez gérer que vos propres commandes' });
      }

      const [updated] = await ctx.db
        .update(marketplaceOrders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(marketplaceOrders.id, input.orderId))
        .returning();

      // If cancelled, restore stock
      if (input.status === 'cancelled' && existing.status !== 'cancelled') {
        const [order] = await ctx.db
          .select({ productId: marketplaceOrders.productId, quantity: marketplaceOrders.quantity })
          .from(marketplaceOrders)
          .where(eq(marketplaceOrders.id, input.orderId));

        if (order) {
          const [product] = await ctx.db
            .select({ quantityAvailable: marketplaceProducts.quantityAvailable })
            .from(marketplaceProducts)
            .where(eq(marketplaceProducts.id, order.productId));

          if (product) {
            const restored = Number(product.quantityAvailable) + Number(order.quantity);
            await ctx.db
              .update(marketplaceProducts)
              .set({ quantityAvailable: String(restored), updatedAt: new Date() })
              .where(eq(marketplaceProducts.id, order.productId));
          }
        }
      }

      return updated;
    }),

  // ======== LIST RECEIVED ORDERS (seller) ========

  listReceivedOrders: protectedProcedure
    .input(listOrdersSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { status, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(marketplaceOrders.sellerFarmId, farmId)];
      if (status) {
        conditions.push(eq(marketplaceOrders.status, status));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select({
            id: marketplaceOrders.id,
            quantity: marketplaceOrders.quantity,
            unitPrice: marketplaceOrders.unitPrice,
            totalAmount: marketplaceOrders.totalAmount,
            status: marketplaceOrders.status,
            deliveryMethod: marketplaceOrders.deliveryMethod,
            deliveryAddress: marketplaceOrders.deliveryAddress,
            notes: marketplaceOrders.notes,
            createdAt: marketplaceOrders.createdAt,
            productName: marketplaceProducts.name,
            buyerName: users.name,
            buyerFarmName: farms.name,
          })
          .from(marketplaceOrders)
          .leftJoin(marketplaceProducts, eq(marketplaceOrders.productId, marketplaceProducts.id))
          .leftJoin(users, eq(marketplaceOrders.buyerId, users.id))
          .leftJoin(farms, eq(marketplaceOrders.buyerFarmId, farms.id))
          .where(where)
          .orderBy(desc(marketplaceOrders.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(marketplaceOrders)
          .where(where),
      ]);

      return {
        items,
        total: Number(countResult[0]?.count ?? 0),
        page,
        limit,
      };
    }),

  // ======== LIST PLACED ORDERS (buyer) ========

  listPlacedOrders: protectedProcedure
    .input(listOrdersSchema)
    .query(async ({ ctx, input }) => {
      const farmId = ensureFarmId(ctx);
      const { status, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(marketplaceOrders.buyerFarmId, farmId)];
      if (status) {
        conditions.push(eq(marketplaceOrders.status, status));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select({
            id: marketplaceOrders.id,
            quantity: marketplaceOrders.quantity,
            unitPrice: marketplaceOrders.unitPrice,
            totalAmount: marketplaceOrders.totalAmount,
            status: marketplaceOrders.status,
            deliveryMethod: marketplaceOrders.deliveryMethod,
            deliveryAddress: marketplaceOrders.deliveryAddress,
            notes: marketplaceOrders.notes,
            createdAt: marketplaceOrders.createdAt,
            productName: marketplaceProducts.name,
            sellerFarmName: farms.name,
          })
          .from(marketplaceOrders)
          .leftJoin(marketplaceProducts, eq(marketplaceOrders.productId, marketplaceProducts.id))
          .leftJoin(farms, eq(marketplaceOrders.sellerFarmId, farms.id))
          .where(where)
          .orderBy(desc(marketplaceOrders.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(marketplaceOrders)
          .where(where),
      ]);

      return {
        items,
        total: Number(countResult[0]?.count ?? 0),
        page,
        limit,
      };
    }),
});
