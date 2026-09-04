import { z } from 'zod';

// --- Subcategory enums ---

export const phytoSubcategoryValues = [
  'herbicide', 'fongicide', 'insecticide', 'acaricide',
  'nematicide', 'molluscicide', 'regulateur_croissance', 'adjuvant',
] as const;

export const fertiSubcategoryValues = [
  'engrais_mineral', 'engrais_organique', 'amendement_calcique',
  'oligo_elements', 'biostimulant',
] as const;

export const semenceSubcategoryValues = [
  'semence_certifiee', 'semence_paysanne', 'plant_bouture', 'greffon',
] as const;

export const inputCategoryValues = ['phyto', 'ferti', 'semence'] as const;
export const inputCategorySchema = z.enum(inputCategoryValues);

export const formValues = ['liquide', 'granule', 'poudre', 'suspension'] as const;

export const stockUnitValues = ['kg', 'L', 'g', 'mL', 'sac', 'unite'] as const;

// --- List schemas ---

export const listPhytoSchema = z.object({
  subcategory: z.enum(phytoSubcategoryValues).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export const listFertiSchema = z.object({
  subcategory: z.enum(fertiSubcategoryValues).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export const listSemenceSchema = z.object({
  subcategory: z.enum(semenceSubcategoryValues).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Create input schema ---

export const createInputSchema = z.discriminatedUnion('inputCategory', [
  z.object({
    inputCategory: z.literal('phyto'),
    name: z.string().min(1).max(255),
    inputSubcategory: z.enum(phytoSubcategoryValues),
    commercialName: z.string().min(1),
    activeIngredient: z.string().optional(),
    recommendedDose: z.string().optional(),
    darDays: z.number().int().nonnegative().optional(),
    toxicityClass: z.string().optional(),
    form: z.enum(formValues).optional(),
    stockInitial: z.number().nonnegative().default(0),
    stockUnit: z.enum(stockUnitValues),
    unitPriceXof: z.number().nonnegative().default(0),
    stockThreshold: z.number().nonnegative().default(0),
    notes: z.string().optional(),
  }),
  z.object({
    inputCategory: z.literal('ferti'),
    name: z.string().min(1).max(255),
    inputSubcategory: z.enum(fertiSubcategoryValues),
    commercialName: z.string().min(1),
    compositionNpk: z.string().optional(),
    recommendedDose: z.string().optional(),
    form: z.enum(formValues).optional(),
    stockInitial: z.number().nonnegative().default(0),
    stockUnit: z.enum(stockUnitValues),
    unitPriceXof: z.number().nonnegative().default(0),
    stockThreshold: z.number().nonnegative().default(0),
    notes: z.string().optional(),
  }),
  z.object({
    inputCategory: z.literal('semence'),
    name: z.string().min(1).max(255),
    inputSubcategory: z.enum(semenceSubcategoryValues),
    cropType: z.string().min(1),
    variety: z.string().optional(),
    lotNumber: z.string().optional(),
    germinationRate: z.number().min(0).max(100).optional(),
    origin: z.string().optional(),
    seedTreatment: z.string().optional(),
    certification: z.string().optional(),
    stockInitial: z.number().nonnegative().default(0),
    stockUnit: z.enum(stockUnitValues),
    unitPriceXof: z.number().nonnegative().default(0),
    stockThreshold: z.number().nonnegative().default(0),
    notes: z.string().optional(),
  }),
]);

export type CreateInputValues = z.infer<typeof createInputSchema>;

// --- Update input schema ---

export const updateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().nullable().optional(),
});

// --- Get stock schema ---

export const getStockSchema = z.object({
  assetId: z.string().uuid(),
});

// --- Apply to log schema ---

export const applyToLogSchema = z.object({
  logId: z.string().uuid(),
  assetId: z.string().uuid(),
  dose: z.number().positive(),
  doseUnit: z.string().max(20),
  method: z.string().optional(),
  machineId: z.string().uuid().optional(),
  treatedSurfaceHa: z.number().positive().optional(),
});

// --- Inventory schemas ---

export const listInventorySchema = z.object({
  category: inputCategorySchema.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export const getInventoryByAssetSchema = z.object({
  assetId: z.string().uuid(),
});

export const adjustInventorySchema = z.object({
  assetId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().max(20),
  type: z.enum(['increment', 'decrement', 'reset']),
  logId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const alertsInventorySchema = z.object({
  // farmId from session
});

// --- Label helpers ---

export const phytoSubcategoryLabels: Record<string, string> = {
  herbicide: 'Herbicide',
  fongicide: 'Fongicide',
  insecticide: 'Insecticide',
  acaricide: 'Acaricide',
  nematicide: 'Nematicide',
  molluscicide: 'Molluscicide',
  regulateur_croissance: 'Regulateur de croissance',
  adjuvant: 'Adjuvant',
};

export const fertiSubcategoryLabels: Record<string, string> = {
  engrais_mineral: 'Engrais mineral',
  engrais_organique: 'Engrais organique',
  amendement_calcique: 'Amendement calcique',
  oligo_elements: 'Oligo-elements',
  biostimulant: 'Biostimulant',
};

export const semenceSubcategoryLabels: Record<string, string> = {
  semence_certifiee: 'Semence certifiee',
  semence_paysanne: 'Semence paysanne',
  plant_bouture: 'Plant / Bouture',
  greffon: 'Greffon',
};

export const inputCategoryLabels: Record<string, string> = {
  phyto: 'Phytosanitaire',
  ferti: 'Fertilisation',
  semence: 'Semences',
};

export const formLabels: Record<string, string> = {
  liquide: 'Liquide',
  granule: 'Granule',
  poudre: 'Poudre',
  suspension: 'Suspension',
};

export const stockUnitLabels: Record<string, string> = {
  kg: 'kg',
  L: 'L',
  g: 'g',
  mL: 'mL',
  sac: 'Sac',
  unite: 'Unite',
};
