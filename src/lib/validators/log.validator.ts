import { z } from 'zod';

// --- Log type enum (mirrors Drizzle enum) ---

export const logTypeValues = [
  'activity', 'observation', 'input', 'harvest', 'seeding',
  'transplanting', 'birth', 'maintenance', 'medical', 'lab_test',
  'movement', 'irrigation',
] as const;

export const logTypeSchema = z.enum(logTypeValues);

// --- Log status enum ---

export const logStatusValues = ['pending', 'done', 'cancelled'] as const;

export const logStatusSchema = z.enum(logStatusValues);

// --- JSONB data sub-schemas per log type ---

export const activityDataSchema = z.object({
  duration_hours: z.number().optional(),
  description: z.string().optional(),
});

export const observationDataSchema = z.object({
  observation_type: z.enum(['emergence_density', 'cultural_stage', 'pest_disease', 'pre_harvest_grading']),
  form_data: z.record(z.string(), z.unknown()).optional(),
});

export const inputProductSchema = z.object({
  product_id: z.string().uuid().optional(),
  product_name: z.string().min(1),
  subcategory: z.string().optional(),
  dose_per_ha: z.number().positive(),
  dose_unit: z.string().max(20),
  quantity_total: z.number().positive().optional(),
  quantity_unit: z.string().max(20).optional(),
});

export const weatherConditionsSchema = z.object({
  temperature_c: z.number().optional(),
  wind_speed_kmh: z.number().nonnegative().optional(),
  wind_direction: z.enum(['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']).optional(),
  humidity_percent: z.number().min(0).max(100).optional(),
  rain_last_24h: z.boolean().optional(),
  rain_forecast_24h: z.boolean().optional(),
});

export const inputDataSchema = z.object({
  input_type: z.enum(['phyto', 'ferti', 'semence']),
  input_subcategory: z.string().optional(),

  // Parcelles ciblées
  target_parcel_ids: z.array(z.string().uuid()).optional(),
  treated_surface_ha: z.number().positive().optional(),

  // Multi-produits (mélange de cuve)
  products: z.array(inputProductSchema).optional(),

  // Rétro-compatibilité single product
  product_id: z.string().uuid().optional(),
  dose: z.number().optional(),
  dose_unit: z.string().optional(),
  method: z.string().optional(),
  machine_id: z.string().uuid().optional(),

  // Partie ciblée
  target_part: z.enum([
    'sol', 'feuillage', 'racines', 'fruits',
    'tiges', 'semences', 'plante_entiere',
  ]).optional(),

  // Volume de bouillie
  water_volume_liters: z.number().positive().optional(),
  spray_volume_per_ha: z.number().positive().optional(),
  spray_volume_total: z.number().positive().optional(),

  // Conditions météo
  weather: weatherConditionsSchema.optional(),
});

export const harvestDataSchema = z.object({
  yield_kg: z.number().optional(),
  yield_per_ha: z.number().optional(),
  quality_grade: z.string().optional(),
  destination: z.string().optional(),
  price_per_kg_xof: z.number().optional(),
});

export const seedingDataSchema = z.object({
  sowing_type: z.enum(['manual', 'machine']),
  machine_id: z.string().uuid().optional(),
  seed_depth_cm: z.number().nonnegative().optional(),
  row_spacing_cm: z.number().positive().optional(),
  plant_spacing_cm: z.number().positive().optional(),
  seed_rate_kg_ha: z.number().positive().optional(),
  seed_rate_unit: z.enum(['kg_ha', 'plants_ha']).optional(),
  seed_id: z.string().uuid().optional(),
  target_parcel_id: z.string().uuid().optional(),
}).refine(
  (data) => data.sowing_type !== 'machine' || data.machine_id != null,
  { message: 'machine_id is required when sowing_type is "machine"', path: ['machine_id'] },
);

export const transplantingDataSchema = z.object({
  source_nursery: z.string().optional(),
  plant_age_days: z.number().optional(),
});

export const birthDataSchema = z.object({
  mother_id: z.string().uuid().optional(),
  sex: z.enum(['male', 'female']).optional(),
  weight_kg: z.number().optional(),
});

export const maintenanceDataSchema = z.object({
  equipment_id: z.string().uuid().optional(),
  maintenance_type: z.string().optional(),
  cost_xof: z.number().optional(),
});

export const medicalDataSchema = z.object({
  animal_id: z.string().uuid().optional(),
  treatment: z.string().optional(),
  veterinarian: z.string().optional(),
});

export const labTestDataSchema = z.object({
  sample_type: z.string().optional(),
  results: z.record(z.string(), z.unknown()).optional(),
});

export const movementDataSchema = z.object({
  from_location: z.string().optional(),
  to_location: z.string().optional(),
  quantity: z.number().optional(),
});

export const irrigationDataSchema = z.object({
  method: z.string().optional(),
  duration_min: z.number().optional(),
  volume_liters: z.number().optional(),
});

// --- Log asset input schema ---

export const logAssetInputSchema = z.object({
  assetId: z.string().uuid(),
  role: z.enum(['subject', 'location', 'input']).default('subject'),
});

// --- Quantity input schema ---

export const quantityInputSchema = z.object({
  measure: z.enum(['count', 'weight', 'volume', 'length', 'area', 'rate']),
  numerator: z.number().int(),
  denominator: z.number().int().default(1),
  unit: z.string().max(20),
  label: z.string().max(100).optional(),
  inventoryAdjustment: z.enum(['increment', 'decrement', 'reset']).optional(),
  inventoryAssetId: z.string().uuid().optional(),
});

// --- Create log schema ---

export const createLogSchema = z.object({
  type: logTypeSchema,
  name: z.string().min(1).max(255),
  timestamp: z.string().or(z.date()),
  status: logStatusSchema.optional(),
  notes: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  flags: z.array(z.string()).optional(),
  isMovement: z.boolean().optional(),
  equipmentIds: z.array(z.string().uuid()).optional(),
  workerIds: z.array(z.string().uuid()).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  assetIds: z.array(logAssetInputSchema).optional(),
  quantities: z.array(quantityInputSchema).optional(),
});

// --- Update log schema ---

export const updateLogSchema = z.object({
  id: z.string().uuid(),
  type: logTypeSchema.optional(),
  name: z.string().min(1).max(255).optional(),
  timestamp: z.string().or(z.date()).optional(),
  status: logStatusSchema.optional(),
  notes: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  flags: z.array(z.string()).optional(),
  isMovement: z.boolean().optional(),
  equipmentIds: z.array(z.string().uuid()).optional(),
  workerIds: z.array(z.string().uuid()).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  assetIds: z.array(logAssetInputSchema).optional(),
  quantities: z.array(quantityInputSchema).optional(),
});

// --- List logs schema (pagination + filters) ---

export const listLogsSchema = z.object({
  type: logTypeSchema.optional(),
  status: logStatusSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  assetId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Get by ID ---

export const getLogByIdSchema = z.object({
  id: z.string().uuid(),
});

// --- Delete ---

export const deleteLogSchema = z.object({
  id: z.string().uuid(),
});

// --- Complete ---

export const completeLogSchema = z.object({
  id: z.string().uuid(),
});
