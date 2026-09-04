import { z } from 'zod';

// --- Asset type enum (mirrors Drizzle enum) ---

export const assetTypeValues = [
  'land', 'plant', 'animal', 'equipment', 'structure',
  'material', 'sensor', 'water', 'seed', 'product', 'compost', 'group',
] as const;

export const assetTypeSchema = z.enum(assetTypeValues);

// --- JSONB data sub-schemas per asset type ---

export const landDataSchema = z.object({
  surface_ha: z.number().positive().optional(),
  soil_type: z.string().optional(),
  irrigation_type: z.string().optional(),
  code_parcelle: z.string().optional(),
  ilot: z.string().optional(),
});

export const plantDataSchema = z.object({
  crop_type: z.string(),
  variety: z.string().optional(),
  family: z.string().optional(),
  planting_date: z.string().optional(),
  expected_harvest_date: z.string().optional(),
  row_spacing_cm: z.number().positive().optional(),
  plant_spacing_cm: z.number().positive().optional(),
  density_plants_ha: z.number().positive().optional(),
});

export const equipmentDataSchema = z.object({
  equipment_type: z.string(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price_xof: z.number().nonnegative().optional(),
  status_machine: z.string().optional(),
});

export const materialDataSchema = z.object({
  input_category: z.enum(['phyto', 'ferti', 'semence']),
  input_subcategory: z.string().optional(),
  commercial_name: z.string().optional(),
  active_ingredient: z.string().optional(),
  composition_npk: z.string().optional(),
  recommended_dose: z.string().optional(),
  dar_days: z.number().nonnegative().optional(),
  toxicity_class: z.string().optional(),
  form: z.string().optional(),
});

export const seedDataSchema = z.object({
  crop_type: z.string(),
  variety: z.string().optional(),
  lot_number: z.string().optional(),
  germination_rate: z.number().min(0).max(100).optional(),
  origin: z.string().optional(),
  seed_treatment: z.string().optional(),
  certification: z.string().optional(),
});

export const animalDataSchema = z.object({
  species: z.string(),
  breed: z.string().optional(),
  sex: z.enum(['male', 'female']).optional(),
  birth_date: z.string().optional(),
  tag_id: z.string().optional(),
});

// --- Create asset schema ---

export const createAssetSchema = z.object({
  type: assetTypeSchema,
  name: z.string().min(1).max(255),
  farmId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  notes: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  flags: z.array(z.string()).optional(),
  isLocation: z.boolean().optional(),
  isFixed: z.boolean().optional(),
  idTags: z.array(z.string()).optional(),
});

// --- Update asset schema ---

export const updateAssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  parentId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  flags: z.array(z.string()).optional(),
  isLocation: z.boolean().optional(),
  isFixed: z.boolean().optional(),
  idTags: z.array(z.string()).optional(),
});

// --- List assets schema (pagination + filters) ---

export const listAssetsSchema = z.object({
  farmId: z.string().uuid(),
  type: assetTypeSchema.optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Get by ID ---

export const getAssetByIdSchema = z.object({
  id: z.string().uuid(),
});

// --- Archive / Restore ---

export const archiveAssetSchema = z.object({
  id: z.string().uuid(),
});
