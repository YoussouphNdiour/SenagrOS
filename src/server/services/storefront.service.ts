import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { resolveUnitPrice } from '@/lib/validators/order.validator';
import type { BuyerType, listProductsSchema } from '@/lib/validators/storefront.validator';
import type { Database } from '../db';
import {
  buyerProfiles,
  deliveryZones,
  farms,
  orderItems,
  orders,
  priceTiers,
  productListings,
  reviews,
} from '../db/schema';

type ListProductsParams = z.output<typeof listProductsSchema>;

/** Per-listing review aggregates (visible reviews only). */
function ratingSubquery(db: Database) {
  return db
    .select({
      listingId: reviews.listingId,
      avgRating: sql<string>`avg(${reviews.rating})`.as('avg_rating'),
      reviewCount: sql<number>`count(*)::int`.as('review_count'),
    })
    .from(reviews)
    .where(eq(reviews.isVisible, true))
    .groupBy(reviews.listingId)
    .as('ratings');
}

/** Per-listing number of non-cancelled orders (popularity). */
function salesSubquery(db: Database) {
  return db
    .select({
      listingId: orderItems.listingId,
      orderCount: sql<number>`count(distinct ${orderItems.orderId})::int`.as('order_count'),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`${orders.status} not in ('cancelled', 'refunded')`)
    .groupBy(orderItems.listingId)
    .as('sales');
}

export const publishedListing = and(
  eq(productListings.isPublished, true),
  isNull(productListings.archivedAt),
);

export async function getBuyerProfileByUserId(db: Database, userId: string) {
  const [profile] = await db
    .select()
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

async function tiersFor(db: Database, listingIds: string[]) {
  if (listingIds.length === 0) return [];
  return db.select().from(priceTiers).where(inArray(priceTiers.listingId, listingIds));
}

export async function listProducts(
  db: Database,
  input: ListProductsParams,
  buyerType: BuyerType | null,
) {
  const {
    search,
    category,
    region,
    farmId,
    minPrice,
    maxPrice,
    bio,
    minRating,
    sort,
    page,
    limit,
  } = input;
  const ratings = ratingSubquery(db);
  const sales = salesSubquery(db);

  const conditions = [publishedListing];
  if (search) {
    const term = `%${search}%`;
    const match = or(
      ilike(productListings.name, term),
      ilike(productListings.description, term),
      ilike(productListings.subcategory, term),
    );
    if (match) conditions.push(match);
  }
  if (category) conditions.push(eq(productListings.category, category));
  if (region) conditions.push(eq(productListings.originRegion, region));
  if (farmId) conditions.push(eq(productListings.farmId, farmId));
  if (minPrice !== undefined) conditions.push(gte(productListings.basePrice, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(productListings.basePrice, String(maxPrice)));
  if (bio) conditions.push(eq(productListings.isBio, true));
  if (minRating !== undefined) conditions.push(gte(ratings.avgRating, String(minRating)));
  const where = and(...conditions);

  const orderBy = {
    relevance: [desc(sql`coalesce(${sales.orderCount}, 0)`), desc(productListings.createdAt)],
    price_asc: [asc(productListings.basePrice)],
    price_desc: [desc(productListings.basePrice)],
    rating: [desc(sql`coalesce(${ratings.avgRating}, 0)`), desc(ratings.reviewCount)],
    recent: [desc(productListings.createdAt)],
  }[sort];

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: productListings.id,
        name: productListings.name,
        category: productListings.category,
        photos: productListings.photos,
        basePrice: productListings.basePrice,
        unit: productListings.unit,
        minOrderQuantity: productListings.minOrderQuantity,
        stockAvailable: productListings.stockAvailable,
        originRegion: productListings.originRegion,
        isBio: productListings.isBio,
        farmId: productListings.farmId,
        farmName: farms.name,
        avgRating: ratings.avgRating,
        reviewCount: ratings.reviewCount,
        orderCount: sales.orderCount,
      })
      .from(productListings)
      .innerJoin(farms, eq(productListings.farmId, farms.id))
      .leftJoin(ratings, eq(ratings.listingId, productListings.id))
      .leftJoin(sales, eq(sales.listingId, productListings.id))
      .where(where)
      .orderBy(...orderBy, asc(productListings.id))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(productListings)
      .leftJoin(ratings, eq(ratings.listingId, productListings.id))
      .where(where),
  ]);

  const tiers = await tiersFor(
    db,
    rows.map((r) => r.id),
  );
  const items = rows.map((r) => {
    const own = tiers.filter((t) => t.listingId === r.id);
    const ownTier = own.find((t) => t.buyerType === (buyerType ?? 'particulier'));
    // Show the buyer's own tier price (from its minimum quantity) in listings
    const { price } = resolveUnitPrice(
      r.basePrice,
      own,
      buyerType,
      ownTier?.minQuantity ? Number(ownTier.minQuantity) : 1,
    );
    return {
      ...r,
      displayPrice: price,
      avgRating: r.avgRating ? Math.round(Number(r.avgRating) * 10) / 10 : null,
      reviewCount: r.reviewCount ?? 0,
      orderCount: r.orderCount ?? 0,
    };
  });

  return { items, total: Number(total), page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getProduct(db: Database, id: string, buyerType: BuyerType | null) {
  const [row] = await db
    .select({ listing: productListings, farm: { id: farms.id, name: farms.name } })
    .from(productListings)
    .innerJoin(farms, eq(productListings.farmId, farms.id))
    .where(and(eq(productListings.id, id), publishedListing))
    .limit(1);
  if (!row) return null;

  const [tiers, ratingRows, farmRating, zones] = await Promise.all([
    tiersFor(db, [id]),
    db
      .select({ rating: reviews.rating, count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(eq(reviews.listingId, id), eq(reviews.isVisible, true)))
      .groupBy(reviews.rating),
    db
      .select({
        avg: sql<string | null>`avg(${reviews.rating})`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .innerJoin(productListings, eq(reviews.listingId, productListings.id))
      .where(and(eq(productListings.farmId, row.farm.id), eq(reviews.isVisible, true))),
    db
      .select({ region: deliveryZones.region, name: deliveryZones.name })
      .from(deliveryZones)
      .where(and(eq(deliveryZones.farmId, row.farm.id), eq(deliveryZones.isActive, true))),
  ]);

  const ownTier = tiers.find((t) => t.buyerType === (buyerType ?? 'particulier'));
  const { price } = resolveUnitPrice(
    row.listing.basePrice,
    tiers,
    buyerType,
    ownTier?.minQuantity ? Number(ownTier.minQuantity) : 1,
  );

  return {
    ...row.listing,
    farm: {
      ...row.farm,
      avgRating: farmRating[0]?.avg ? Math.round(Number(farmRating[0].avg) * 10) / 10 : null,
      reviewCount: farmRating[0]?.count ?? 0,
      deliveryRegions: [...new Set(zones.map((z) => z.region))],
    },
    tiers: tiers.sort((a, b) => Number(b.price) - Number(a.price)),
    displayPrice: price,
    ratingRows,
  };
}

export async function listCategories(db: Database) {
  const rows = await db
    .select({ category: productListings.category, count: sql<number>`count(*)::int` })
    .from(productListings)
    .where(publishedListing)
    .groupBy(productListings.category)
    .orderBy(asc(productListings.category));
  return rows;
}

export async function listRegions(db: Database) {
  const rows = await db
    .selectDistinct({ region: productListings.originRegion })
    .from(productListings)
    .where(and(publishedListing, sql`${productListings.originRegion} is not null`))
    .orderBy(asc(productListings.originRegion));
  return rows.map((r) => r.region).filter((r): r is string => !!r);
}

/** Farms that publish at least one listing, with listing count and average rating. */
export async function listProducers(db: Database, limit = 6) {
  return db
    .select({
      id: farms.id,
      name: farms.name,
      description: farms.description,
      latitude: farms.latitude,
      longitude: farms.longitude,
      listingCount: sql<number>`count(distinct ${productListings.id})::int`,
      regions: sql<
        string[]
      >`array_remove(array_agg(distinct ${productListings.originRegion}), null)`,
      avgRating: sql<
        string | null
      >`(select avg(r.rating) from reviews r join product_listings pl on pl.id = r.listing_id where pl.farm_id = ${farms.id} and r.is_visible)`,
    })
    .from(farms)
    .innerJoin(productListings, eq(productListings.farmId, farms.id))
    .where(publishedListing)
    .groupBy(farms.id)
    .orderBy(desc(sql`count(distinct ${productListings.id})`))
    .limit(limit);
}

/**
 * Prices a set of cart lines for the given buyer profile. Unknown or unpublished
 * listings are returned in `unavailable`.
 */
export async function quoteItems(
  db: Database,
  items: { listingId: string; quantity: number }[],
  buyerType: BuyerType | null,
) {
  const ids = [...new Set(items.map((i) => i.listingId))];
  if (ids.length === 0) return { lines: [], unavailable: [] as string[] };
  const [listings, tiers] = await Promise.all([
    db
      .select({
        id: productListings.id,
        name: productListings.name,
        photos: productListings.photos,
        basePrice: productListings.basePrice,
        unit: productListings.unit,
        minOrderQuantity: productListings.minOrderQuantity,
        stockAvailable: productListings.stockAvailable,
        farmId: productListings.farmId,
        farmName: farms.name,
      })
      .from(productListings)
      .innerJoin(farms, eq(productListings.farmId, farms.id))
      .where(and(inArray(productListings.id, ids), publishedListing)),
    tiersFor(db, ids),
  ]);

  const lines = [];
  const unavailable: string[] = [];
  for (const item of items) {
    const listing = listings.find((l) => l.id === item.listingId);
    if (!listing) {
      unavailable.push(item.listingId);
      continue;
    }
    const { price, appliedTier } = resolveUnitPrice(
      listing.basePrice,
      tiers.filter((t) => t.listingId === listing.id),
      buyerType,
      item.quantity,
    );
    lines.push({
      ...listing,
      quantity: item.quantity,
      unitPrice: price,
      appliedTier,
      lineTotal: Math.round(price * item.quantity * 100) / 100,
      minOrderQuantity: Number(listing.minOrderQuantity ?? 1),
      stockAvailable: Number(listing.stockAvailable),
    });
  }
  return { lines, unavailable };
}

export async function listActiveZones(db: Database, farmIds: string[]) {
  if (farmIds.length === 0) return [];
  return db
    .select()
    .from(deliveryZones)
    .where(and(inArray(deliveryZones.farmId, farmIds), eq(deliveryZones.isActive, true)))
    .orderBy(asc(deliveryZones.deliveryFee));
}

/** Buyer type of the current visitor, or null for anonymous visitors and non-buyers. */
export async function buyerTypeForUser(
  db: Database,
  userId: string | null | undefined,
): Promise<BuyerType | null> {
  if (!userId) return null;
  const profile = await getBuyerProfileByUserId(db, userId);
  return (profile?.buyerType as BuyerType | undefined) ?? null;
}

export async function listProductReviews(
  db: Database,
  input: {
    listingId: string;
    sort: 'recent' | 'rating_desc' | 'rating_asc';
    page: number;
    limit: number;
  },
) {
  const where = and(eq(reviews.listingId, input.listingId), eq(reviews.isVisible, true));
  const orderBy = {
    recent: [desc(reviews.createdAt)],
    rating_desc: [desc(reviews.rating), desc(reviews.createdAt)],
    rating_asc: [asc(reviews.rating), desc(reviews.createdAt)],
  }[input.sort];
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        sellerResponse: reviews.sellerResponse,
        createdAt: reviews.createdAt,
        buyerName: buyerProfiles.contactName,
        buyerType: buyerProfiles.buyerType,
      })
      .from(reviews)
      .innerJoin(buyerProfiles, eq(reviews.buyerProfileId, buyerProfiles.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(input.limit)
      .offset((input.page - 1) * input.limit),
    db.select({ total: sql<number>`count(*)::int` }).from(reviews).where(where),
  ]);
  return { items, total: Number(total), page: input.page, limit: input.limit };
}
