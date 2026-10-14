import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../schema';
import {
  buyerProfiles,
  deliveryZones,
  farmMembers,
  farms,
  priceTiers,
  productListings,
  users,
} from '../schema';

type Db = PostgresJsDatabase<typeof schema>;

const photo = (slug: string, alt: string) => [
  { url: `/storefront/products/${slug}.svg`, alt, order: 0 },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

interface ListingSeed {
  name: string;
  slug: string;
  category: string;
  description: string;
  unit: string;
  stock: number;
  minOrder: number;
  region: string;
  bio?: boolean;
  shelfLife: number;
  harvestedDaysAgo: number;
  /** [detail, semi-gros, gros] FCFA/unit */
  prices: [number, number, number];
  /** min quantities for [semi-gros, gros] */
  mins: [number, number];
}

/** 10 listings for the demo farm (SCL Diama) — Niayes vegetables, cereals, fruits. */
const MAIN_LISTINGS: ListingSeed[] = [
  {
    name: 'Tomates fraîches',
    slug: 'tomates',
    category: 'legumes',
    description:
      'Tomates rondes des Niayes, récoltées à maturité. Idéales pour le thiéboudienne et les sauces.',
    unit: 'kg',
    stock: 800,
    minOrder: 1,
    region: 'Niayes',
    shelfLife: 7,
    harvestedDaysAgo: 2,
    prices: [500, 400, 350],
    mins: [10, 100],
  },
  {
    name: 'Oignons violets de Galmi',
    slug: 'oignons',
    category: 'legumes',
    description: 'Oignons violets bien secs, longue conservation.',
    unit: 'kg',
    stock: 2000,
    minOrder: 1,
    region: 'Niayes',
    shelfLife: 90,
    harvestedDaysAgo: 10,
    prices: [450, 380, 330],
    mins: [25, 250],
  },
  {
    name: 'Mil souna',
    slug: 'mil',
    category: 'cereales',
    description: 'Mil souna décortiqué, parfait pour le thiakry et le lakh.',
    unit: 'kg',
    stock: 1500,
    minOrder: 1,
    region: 'Kaolack',
    shelfLife: 180,
    harvestedDaysAgo: 30,
    prices: [400, 350, 300],
    mins: [50, 500],
  },
  {
    name: 'Maïs grain',
    slug: 'mais',
    category: 'cereales',
    description: 'Maïs jaune séché, pour la consommation et l’alimentation animale.',
    unit: 'kg',
    stock: 3000,
    minOrder: 5,
    region: 'Kolda',
    shelfLife: 180,
    harvestedDaysAgo: 25,
    prices: [300, 260, 230],
    mins: [50, 500],
  },
  {
    name: 'Arachide décortiquée',
    slug: 'arachide',
    category: 'oleagineux',
    description: 'Arachide du bassin arachidier, triée à la main.',
    unit: 'kg',
    stock: 1200,
    minOrder: 1,
    region: 'Kaffrine',
    shelfLife: 120,
    harvestedDaysAgo: 20,
    prices: [900, 800, 720],
    mins: [25, 250],
  },
  {
    name: 'Pommes de terre',
    slug: 'pommes-de-terre',
    category: 'tubercules',
    description: 'Pommes de terre de contre-saison froide, calibre moyen.',
    unit: 'kg',
    stock: 1000,
    minOrder: 1,
    region: 'Niayes',
    shelfLife: 45,
    harvestedDaysAgo: 5,
    prices: [550, 470, 420],
    mins: [20, 200],
  },
  {
    name: 'Mangues Kent',
    slug: 'mangues',
    category: 'fruits',
    description: 'Mangues Kent juteuses, cueillies à maturité.',
    unit: 'kg',
    stock: 600,
    minOrder: 1,
    region: 'Thiès',
    bio: true,
    shelfLife: 10,
    harvestedDaysAgo: 1,
    prices: [700, 600, 520],
    mins: [20, 150],
  },
  {
    name: 'Gombo frais',
    slug: 'gombo',
    category: 'legumes',
    description: 'Gombo tendre pour soupou kandja.',
    unit: 'kg',
    stock: 300,
    minOrder: 1,
    region: 'Niayes',
    bio: true,
    shelfLife: 5,
    harvestedDaysAgo: 1,
    prices: [800, 700, 650],
    mins: [10, 50],
  },
  {
    name: 'Piment antillais',
    slug: 'piment',
    category: 'legumes',
    description: 'Piment fort et parfumé.',
    unit: 'kg',
    stock: 150,
    minOrder: 0.5,
    region: 'Niayes',
    shelfLife: 10,
    harvestedDaysAgo: 2,
    prices: [1500, 1300, 1150],
    mins: [5, 30],
  },
  {
    name: 'Patates douces',
    slug: 'patates-douces',
    category: 'tubercules',
    description: 'Patates douces à chair orange, riches en vitamine A.',
    unit: 'kg',
    stock: 700,
    minOrder: 1,
    region: 'Thiès',
    shelfLife: 30,
    harvestedDaysAgo: 6,
    prices: [450, 380, 340],
    mins: [20, 200],
  },
];

/** A second producer so the storefront shows several farms. */
const CASAMANCE_LISTINGS: ListingSeed[] = [
  {
    name: 'Riz paddy de Casamance',
    slug: 'riz',
    category: 'cereales',
    description: 'Riz local cultivé en bas-fonds.',
    unit: 'kg',
    stock: 2500,
    minOrder: 5,
    region: 'Ziguinchor',
    bio: true,
    shelfLife: 365,
    harvestedDaysAgo: 40,
    prices: [550, 480, 430],
    mins: [50, 500],
  },
  {
    name: 'Manioc frais',
    slug: 'manioc',
    category: 'tubercules',
    description: 'Racines de manioc fraîches.',
    unit: 'kg',
    stock: 900,
    minOrder: 1,
    region: 'Ziguinchor',
    shelfLife: 4,
    harvestedDaysAgo: 1,
    prices: [350, 300, 260],
    mins: [20, 200],
  },
  {
    name: 'Bissap séché',
    slug: 'bissap',
    category: 'produits_transformes',
    description: 'Fleurs d’hibiscus séchées pour jus de bissap.',
    unit: 'kg',
    stock: 200,
    minOrder: 0.5,
    region: 'Ziguinchor',
    bio: true,
    shelfLife: 365,
    harvestedDaysAgo: 60,
    prices: [2500, 2200, 2000],
    mins: [5, 50],
  },
];

const MAIN_ZONES = [
  { name: 'Dakar', region: 'Dakar', department: 'Dakar', fee: 2000, min: 5000, days: 1 },
  { name: 'Thiès', region: 'Thiès', department: 'Thiès', fee: 1500, min: 5000, days: 1 },
  {
    name: 'Saint-Louis',
    region: 'Saint-Louis',
    department: 'Saint-Louis',
    fee: 2500,
    min: 10000,
    days: 2,
  },
  { name: 'Kaolack', region: 'Kaolack', department: 'Kaolack', fee: 3000, min: 15000, days: 2 },
  {
    name: 'Ziguinchor',
    region: 'Ziguinchor',
    department: 'Ziguinchor',
    fee: 5000,
    min: 25000,
    days: 4,
  },
];

const CASAMANCE_ZONES = [
  {
    name: 'Ziguinchor ville',
    region: 'Ziguinchor',
    department: 'Ziguinchor',
    fee: 1000,
    min: 3000,
    days: 1,
  },
  { name: 'Dakar', region: 'Dakar', department: 'Dakar', fee: 4500, min: 20000, days: 3 },
];

const BUYERS = [
  {
    email: 'particulier@senagros.local',
    name: 'Awa Ndiaye',
    buyerType: 'particulier',
    company: null,
    ninea: null,
    phone: '77 123 45 67',
    address: 'Sicap Liberté 6, villa 45',
    city: 'Dakar',
    region: 'Dakar',
  },
  {
    email: 'superette@senagros.local',
    name: 'Moussa Fall',
    buyerType: 'superette',
    company: 'Superette Baobab',
    ninea: '004567890',
    phone: '76 234 56 78',
    address: 'Avenue Blaise Diagne, Médina',
    city: 'Dakar',
    region: 'Dakar',
  },
  {
    email: 'grande-surface@senagros.local',
    name: 'Fatou Sarr',
    buyerType: 'grande_surface',
    company: 'Hypermarché Teranga',
    ninea: '009876543',
    phone: '78 345 67 89',
    address: 'Route de Ngor, Almadies',
    city: 'Dakar',
    region: 'Dakar',
  },
] as const;

export const BUYER_PASSWORD = 'buyer123';

async function seedListings(db: Db, farmId: string, sellerId: string, list: ListingSeed[]) {
  for (const l of list) {
    const [existing] = await db
      .select({ id: productListings.id })
      .from(productListings)
      .where(and(eq(productListings.farmId, farmId), eq(productListings.name, l.name)))
      .limit(1);
    if (existing) continue;
    const [listing] = await db
      .insert(productListings)
      .values({
        farmId,
        sellerId,
        name: l.name,
        description: l.description,
        category: l.category,
        photos: photo(l.slug, l.name),
        basePrice: String(l.prices[0]),
        unit: l.unit,
        minOrderQuantity: String(l.minOrder),
        stockAvailable: String(l.stock),
        originRegion: l.region,
        isBio: l.bio ?? false,
        certifications: l.bio ? ['bio'] : [],
        harvestDate: daysAgo(l.harvestedDaysAgo),
        shelfLifeDays: l.shelfLife,
        isPublished: true,
      })
      .returning({ id: productListings.id });
    await db.insert(priceTiers).values([
      {
        listingId: listing.id,
        buyerType: 'particulier',
        price: String(l.prices[0]),
        minQuantity: String(l.minOrder),
      },
      {
        listingId: listing.id,
        buyerType: 'superette',
        price: String(l.prices[1]),
        minQuantity: String(l.mins[0]),
      },
      {
        listingId: listing.id,
        buyerType: 'grande_surface',
        price: String(l.prices[2]),
        minQuantity: String(l.mins[1]),
      },
    ]);
  }
}

async function seedZones(db: Db, farmId: string, zones: typeof MAIN_ZONES) {
  for (const z of zones) {
    const [existing] = await db
      .select({ id: deliveryZones.id })
      .from(deliveryZones)
      .where(and(eq(deliveryZones.farmId, farmId), eq(deliveryZones.name, z.name)))
      .limit(1);
    if (existing) continue;
    await db.insert(deliveryZones).values({
      farmId,
      name: z.name,
      region: z.region,
      department: z.department,
      deliveryFee: String(z.fee),
      minOrderAmount: String(z.min),
      estimatedDays: z.days,
    });
  }
}

/**
 * Phase 13 storefront demo data. Idempotent: rows are matched by natural keys
 * (email, farm + name) so it can run on an already-seeded database.
 */
export async function seedStorefront(db: Db, mainFarmId: string, mainSellerId: string) {
  // 3 demo buyers, one per profile
  const passwordHash = await bcrypt.hash(BUYER_PASSWORD, 12);
  for (const b of BUYERS) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, b.email))
      .limit(1);
    if (existing) continue;
    const [user] = await db
      .insert(users)
      .values({
        email: b.email,
        name: b.name,
        passwordHash,
        role: 'buyer',
        locale: 'fr',
        isActive: true,
      })
      .returning({ id: users.id });
    await db.insert(buyerProfiles).values({
      userId: user.id,
      buyerType: b.buyerType,
      companyName: b.company,
      contactName: b.name,
      phone: b.phone,
      email: b.email,
      address: b.address,
      city: b.city,
      region: b.region,
      ninea: b.ninea,
      isVerified: b.buyerType !== 'particulier',
    });
  }

  await seedListings(db, mainFarmId, mainSellerId, MAIN_LISTINGS);
  await seedZones(db, mainFarmId, MAIN_ZONES);

  // Second producer: Ferme Bio de Casamance
  const casamanceEmail = 'producteur.casamance@senagros.local';
  let [casamanceUser] = await db
    .select({ id: users.id, farmId: users.farmId })
    .from(users)
    .where(eq(users.email, casamanceEmail))
    .limit(1);
  if (!casamanceUser) {
    const [farm] = await db
      .insert(farms)
      .values({
        name: 'Ferme Bio de Casamance',
        description: 'Riziculture et cultures vivrières biologiques en Basse-Casamance',
        latitude: '12.5833',
        longitude: '-16.2719',
        timezone: 'Africa/Dakar',
        currency: 'XOF',
        locale: 'fr',
      })
      .returning({ id: farms.id });
    const [user] = await db
      .insert(users)
      .values({
        email: casamanceEmail,
        name: 'Ibrahima Diatta',
        passwordHash: await bcrypt.hash('admin123', 12),
        role: 'owner',
        farmId: farm.id,
        locale: 'fr',
        isActive: true,
      })
      .returning({ id: users.id, farmId: users.farmId });
    await db.insert(farmMembers).values({ farmId: farm.id, userId: user.id, role: 'owner' });
    casamanceUser = user;
  }
  if (casamanceUser.farmId) {
    await seedListings(db, casamanceUser.farmId, casamanceUser.id, CASAMANCE_LISTINGS);
    await seedZones(db, casamanceUser.farmId, CASAMANCE_ZONES);
  }
}
