import { z } from 'zod';

// --- Enums ---

export const buyerTypeEnum = z.enum(['particulier', 'superette', 'grande_surface']);
export type BuyerType = z.infer<typeof buyerTypeEnum>;

export const BUYER_TYPES = buyerTypeEnum.options;

export const buyerTypeLabels: Record<BuyerType, string> = {
  particulier: 'Particulier',
  superette: 'Superette',
  grande_surface: 'Grande surface',
};

/** Price level shown to buyers for each profile (detail / semi-gros / gros). */
export const buyerTypePriceLabels: Record<BuyerType, string> = {
  particulier: 'Prix détail',
  superette: 'Prix semi-gros',
  grande_surface: 'Prix gros',
};

export const listingCategoryEnum = z.enum([
  'cereales',
  'legumes',
  'fruits',
  'tubercules',
  'oleagineux',
  'produits_transformes',
  'autres',
]);
export type ListingCategory = z.infer<typeof listingCategoryEnum>;

export const listingCategoryLabels: Record<ListingCategory, string> = {
  cereales: 'Céréales',
  legumes: 'Légumes',
  fruits: 'Fruits',
  tubercules: 'Tubercules',
  oleagineux: 'Oléagineux',
  produits_transformes: 'Produits transformés',
  autres: 'Autres',
};

export const listingUnitEnum = z.enum(['kg', 'tonne', 'piece', 'botte', 'caisse', 'sac']);
export type ListingUnit = z.infer<typeof listingUnitEnum>;

export const listingUnitLabels: Record<ListingUnit, string> = {
  kg: 'kg',
  tonne: 'tonne',
  piece: 'pièce',
  botte: 'botte',
  caisse: 'caisse',
  sac: 'sac',
};

export const SENEGAL_REGIONS = [
  'Dakar',
  'Diourbel',
  'Fatick',
  'Kaffrine',
  'Kaolack',
  'Kédougou',
  'Kolda',
  'Louga',
  'Matam',
  'Saint-Louis',
  'Sédhiou',
  'Tambacounda',
  'Thiès',
  'Ziguinchor',
] as const;

export const listSortEnum = z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'recent']);
export type ListSort = z.infer<typeof listSortEnum>;

export const listSortLabels: Record<ListSort, string> = {
  relevance: 'Pertinence',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant',
  rating: 'Mieux notés',
  recent: 'Plus récents',
};

// --- Catalogue (public) ---

export const listProductsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: listingCategoryEnum.optional(),
  region: z.string().max(100).optional(),
  farmId: z.string().uuid().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  bio: z.boolean().optional(),
  minRating: z.number().int().min(1).max(5).optional(),
  sort: listSortEnum.default('relevance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(48).default(12),
});
export type ListProductsInput = z.input<typeof listProductsSchema>;

/** Parses catalogue URL search params into a listProducts input (invalid values are dropped). */
export function parseCatalogueParams(
  params: Record<string, string | string[] | undefined>,
): z.output<typeof listProductsSchema> {
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (key: string) => {
    const v = get(key);
    if (v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const raw = {
    search: get('q') || undefined,
    category: get('categorie') || undefined,
    region: get('region') || undefined,
    farmId: get('ferme') || undefined,
    minPrice: num('prix_min'),
    maxPrice: num('prix_max'),
    bio: get('bio') === '1' ? true : undefined,
    minRating: num('note_min'),
    sort: get('tri') || undefined,
    page: num('page'),
  };
  const parsed = listProductsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Drop the offending fields and retry with what is valid
  const cleaned: Record<string, unknown> = { ...raw };
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string') delete cleaned[key];
  }
  return listProductsSchema.parse(cleaned);
}

export const productIdSchema = z.object({ id: z.string().uuid() });

export const quoteSchema = z.object({
  items: z
    .array(z.object({ listingId: z.string().uuid(), quantity: z.number().positive() }))
    .max(50),
});

// --- Seller catalogue management ---

export const priceTierInputSchema = z.object({
  buyerType: buyerTypeEnum,
  price: z.number().positive('Le prix doit être positif'),
  minQuantity: z.number().positive().default(1),
  maxQuantity: z.number().positive().nullable().optional(),
});

const listingFields = {
  name: z.string().trim().min(2, 'Le nom doit comporter au moins 2 caractères').max(255),
  description: z.string().max(5000).optional(),
  category: listingCategoryEnum,
  subcategory: z.string().max(100).optional(),
  photos: z
    .array(z.object({ url: z.string().min(1), alt: z.string().optional() }))
    .max(8)
    .default([]),
  unit: listingUnitEnum.default('kg'),
  minOrderQuantity: z.number().positive().default(1),
  stockAvailable: z.number().min(0, 'Le stock ne peut pas être négatif'),
  originRegion: z.string().max(100).optional(),
  isBio: z.boolean().default(false),
  harvestDate: z.string().date().optional().or(z.literal('')),
  shelfLifeDays: z.number().int().positive().optional(),
  isPublished: z.boolean().default(true),
};

/**
 * A listing is published with a 3-level price grid: particulier (detail),
 * superette (semi-gros) and grande_surface (gros). base_price = particulier price.
 */
export const upsertListingSchema = z
  .object({
    id: z.string().uuid().optional(),
    ...listingFields,
    tiers: z.array(priceTierInputSchema).min(1),
  })
  .superRefine((val, ctx) => {
    const types = val.tiers.map((t) => t.buyerType);
    if (new Set(types).size !== types.length) {
      ctx.addIssue({ code: 'custom', path: ['tiers'], message: 'Un seul tarif par profil' });
    }
    if (!types.includes('particulier')) {
      ctx.addIssue({ code: 'custom', path: ['tiers'], message: 'Le prix détail est obligatoire' });
    }
    const byType = Object.fromEntries(val.tiers.map((t) => [t.buyerType, t.price]));
    if (byType.superette !== undefined && byType.superette > byType.particulier) {
      ctx.addIssue({
        code: 'custom',
        path: ['tiers'],
        message: 'Le prix semi-gros doit être inférieur ou égal au prix détail',
      });
    }
    if (
      byType.grande_surface !== undefined &&
      byType.grande_surface > (byType.superette ?? byType.particulier)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['tiers'],
        message: 'Le prix gros doit être inférieur ou égal au prix semi-gros',
      });
    }
  });
export type UpsertListingInput = z.input<typeof upsertListingSchema>;

export const upsertZoneSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  department: z.string().max(100).optional(),
  deliveryFee: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  estimatedDays: z.number().int().min(0).max(60).default(1),
  isActive: z.boolean().default(true),
});
export type UpsertZoneInput = z.input<typeof upsertZoneSchema>;

// --- Buyer registration ---

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+221)?\s?[37]\d([\s.-]?\d){7}$/, 'Numéro sénégalais invalide (ex: 77 123 45 67)');

export const registerBuyerSchema = z
  .object({
    contactName: z.string().trim().min(2, 'Minimum 2 caractères').max(255),
    phone: phoneSchema,
    email: z.string().trim().email('Email invalide'),
    password: z.string().min(6, 'Minimum 6 caractères'),
    buyerType: buyerTypeEnum,
    companyName: z.string().trim().max(255).optional(),
    ninea: z.string().trim().max(20).optional(),
    address: z.string().trim().min(5, 'Adresse trop courte'),
    city: z.string().trim().max(100).optional(),
    region: z.string().trim().max(100).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.buyerType !== 'particulier' && !val.companyName) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyName'],
        message: "Le nom de l'enseigne est requis",
      });
    }
    if (val.buyerType === 'grande_surface' && !val.ninea) {
      ctx.addIssue({ code: 'custom', path: ['ninea'], message: 'Le NINEA est requis' });
    }
  });
export type RegisterBuyerInput = z.input<typeof registerBuyerSchema>;

// --- Formatting helpers ---

export function formatXof(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}

export function formatQuantity(q: number | string): string {
  const n = Number(q);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
