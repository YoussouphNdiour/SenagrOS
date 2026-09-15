import { z } from 'zod';

// --- Season type enum ---

export const seasonTypeValues = [
  'hivernage',
  'contre_saison_chaude',
  'contre_saison_froide',
] as const;

export const seasonTypeSchema = z.enum(seasonTypeValues);

// --- Season status enum ---

export const seasonStatusValues = ['planning', 'active', 'completed'] as const;

export const seasonStatusSchema = z.enum(seasonStatusValues);

// --- Rotation compatibility enum ---

export const rotationCompatibilityValues = [
  'recommended',
  'neutral',
  'avoid',
  'forbidden',
] as const;

export const rotationCompatibilitySchema = z.enum(rotationCompatibilityValues);

// --- Crop Family ---

export const createCropFamilySchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// --- Crop ---

export const createCropSchema = z.object({
  code: z.string().min(1).max(20),
  nameFr: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional(),
  nameWo: z.string().max(100).optional(),
  familyId: z.string().uuid().optional(),
  cycleShortDays: z.number().int().positive().optional(),
  cycleLongDays: z.number().int().positive().optional(),
  seasonPreference: z.array(z.string()).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

// --- Crop Variety ---

export const createCropVarietySchema = z.object({
  cropId: z.string().uuid(),
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(100),
  cycleDays: z.number().int().positive().optional(),
  yieldPotentialKgHa: z.number().int().positive().optional(),
  characteristics: z.record(z.string(), z.unknown()).optional(),
  origin: z.string().max(100).optional(),
});

// --- Season ---

export const createSeasonSchema = z.object({
  name: z.string().min(1).max(100),
  type: seasonTypeSchema,
  startDate: z.string(),
  endDate: z.string(),
  year: z.number().int().positive(),
  status: seasonStatusSchema.optional(),
  notes: z.string().optional(),
});

export const updateSeasonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  type: seasonTypeSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  year: z.number().int().positive().optional(),
  status: seasonStatusSchema.optional(),
  notes: z.string().optional(),
});

// --- Rotation Rule ---

export const createRotationRuleSchema = z.object({
  farmId: z.string().uuid().optional(),
  previousCropId: z.string().uuid(),
  nextCropId: z.string().uuid(),
  compatibility: rotationCompatibilitySchema,
  reason: z.string().optional(),
  minIntervalDays: z.number().int().positive().optional(),
  recommendation: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

// --- List schemas ---

export const listCropsSchema = z.object({
  search: z.string().optional(),
  familyId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export const listSeasonsSchema = z.object({
  year: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export const listVarietiesSchema = z.object({
  cropId: z.string().uuid(),
});

export const listRotationRulesSchema = z.object({
  farmId: z.string().uuid().optional(),
  cropId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Check rotation ---

export const checkRotationSchema = z.object({
  previousCropId: z.string().uuid(),
  nextCropId: z.string().uuid(),
});
