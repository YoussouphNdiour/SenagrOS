import { z } from 'zod';

// --- Form type enum ---

export const observationFormTypeValues = [
  'emergence_density',
  'cultural_stage',
  'pest_disease',
  'pre_harvest_grading',
] as const;

export const observationFormTypeSchema = z.enum(observationFormTypeValues);

export const formTypeLabels: Record<string, string> = {
  emergence_density: 'Densité de levée',
  cultural_stage: 'Suivi stade cultural',
  pest_disease: 'Maladies-Ravageurs',
  pre_harvest_grading: 'Agréage pré-récolte',
};

// --- List observations schema ---

export const listObservationsSchema = z.object({
  formType: observationFormTypeSchema.optional(),
  assetId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export const getObservationByIdSchema = z.object({
  id: z.string().uuid(),
});

// --- Repetition schema (density) ---

const repetitionSchema = z.object({
  rep: z.number().int().positive(),
  plantCount: z.number().int().nonnegative(),
});

// --- Create Density schema ---

export const createDensitySchema = z.object({
  assetId: z.string().uuid(),
  cropType: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  observationDate: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  observedSurfaceHa: z.number().positive().optional(),
  numRepetitions: z.number().int().min(1).max(50).default(10),
  theoreticalDensity: z.number().positive(),
  sampleAreaM2: z.number().positive().default(1),
  repetitions: z.array(repetitionSchema).min(1),
  observerRemarks: z.string().optional(),
  supervisorRemarks: z.string().optional(),
});

export type CreateDensityValues = z.input<typeof createDensitySchema>;

// --- Create Stage schema ---

export const createStageSchema = z.object({
  assetId: z.string().uuid(),
  cropType: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  observationDate: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  observedSurfaceHa: z.number().positive().optional(),
  stageReached: z.string().min(1),
  dateReached: z.string().min(1),
  observerRemarks: z.string().optional(),
  supervisorRemarks: z.string().optional(),
});

export type CreateStageValues = z.input<typeof createStageSchema>;

// --- Pest/Disease observation row schema ---

const pestObservationRowSchema = z.object({
  pestOrDisease: z.string().min(1),
  category: z.enum(['ravageur', 'maladie']),
  targets: z.array(z.number().int().nonnegative()),
});

// --- Create PestDisease schema ---

export const createPestDiseaseSchema = z.object({
  assetId: z.string().uuid(),
  cropType: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  observationDate: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  observedSurfaceHa: z.number().positive().optional(),
  numTargets: z.number().int().min(1).max(50).default(10),
  treatmentThreshold: z.number().min(0).max(100).default(5),
  observations: z.array(pestObservationRowSchema).min(1),
  observerRemarks: z.string().optional(),
  supervisorRemarks: z.string().optional(),
});

export type CreatePestDiseaseValues = z.input<typeof createPestDiseaseSchema>;

// --- Length class schema (grading) ---

const lengthClassSchema = z.object({
  gt19cm: z.number().int().nonnegative().default(0),
  from19to16cm: z.number().int().nonnegative().default(0),
  from16to14cm: z.number().int().nonnegative().default(0),
  lt14cm: z.number().int().nonnegative().default(0),
});

const majorDefectSchema = z.object({
  type: z.enum(['degats_oiseaux', 'degats_chenilles', 'malformations', 'mauvaise_fecondation']),
  count: z.number().int().nonnegative().default(0),
});

const maturityIndexSchema = z.object({
  matureAtDate: z.number().int().nonnegative().default(0),
  matureAtForecast: z.number().int().nonnegative().default(0),
  immature: z.number().int().nonnegative().default(0),
});

// --- Create Grading schema ---

export const createGradingSchema = z.object({
  assetId: z.string().uuid(),
  cropType: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  observationDate: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  observedSurfaceHa: z.number().positive().optional(),
  sampleSize: z.number().int().positive().default(20),
  totalLengths: lengthClassSchema,
  marketableLengths: lengthClassSchema,
  majorDefects: z.array(majorDefectSchema),
  maturityIndex: maturityIndexSchema,
  estimatedYieldPerHa: z.number().nonnegative().optional(),
  estimatedHarvestDate: z.string().optional(),
  observerRemarks: z.string().optional(),
  supervisorRemarks: z.string().optional(),
});

export type CreateGradingValues = z.input<typeof createGradingSchema>;

// --- Update observation schema ---

export const updateObservationSchema = z.object({
  id: z.string().uuid(),
  observerRemarks: z.string().optional(),
  supervisorRemarks: z.string().optional(),
});

// --- Delete observation schema ---

export const deleteObservationSchema = z.object({
  id: z.string().uuid(),
});

// --- Calculation helpers (shared client/server) ---

export function calculateDensity(input: {
  repetitions: { plantCount: number }[];
  sampleAreaM2: number;
  theoreticalDensity: number;
}) {
  const totalPlants = input.repetitions.reduce((sum, r) => sum + r.plantCount, 0);
  const numReps = input.repetitions.length;
  const realDensityPerHa =
    numReps > 0 && input.sampleAreaM2 > 0
      ? (totalPlants / (numReps * input.sampleAreaM2)) * 10000
      : 0;
  const emergenceRatePct =
    input.theoreticalDensity > 0
      ? (realDensityPerHa / input.theoreticalDensity) * 100
      : 0;

  return {
    totalPlants,
    realDensityPerHa: Math.round(realDensityPerHa),
    emergenceRatePct: Math.round(emergenceRatePct * 100) / 100,
  };
}

export function calculatePestTotals(
  targets: number[],
  numTargets: number,
) {
  const total = targets.reduce((sum, v) => sum + (v > 0 ? 1 : 0), 0);
  const pctInfested = numTargets > 0 ? (total / numTargets) * 100 : 0;
  return { total, pctInfested: Math.round(pctInfested * 100) / 100 };
}

export function calculateGradingTotals(lengths: {
  gt19cm: number;
  from19to16cm: number;
  from16to14cm: number;
  lt14cm: number;
}) {
  return lengths.gt19cm + lengths.from19to16cm + lengths.from16to14cm + lengths.lt14cm;
}

// --- Default pests and diseases lists ---

export const defaultPests = [
  'Chenilles frontalères',
  'Pucerons',
  'Mouche blanche (aleurode)',
  'Mouche du fruit',
  'Mouche de nuit',
  'Thrips',
  'Mouches mineuses',
  'Cicadelles',
  'Acariens',
  'Nématodes',
] as const;

export const defaultDiseases = [
  'Autres viroses',
  'Fusariose',
  'Mildiou',
  'Oïdium',
  'Fonte de semis',
  'Virose',
  'Bactériose',
  'Escargots',
  'Graminales',
  'Solanacées',
  'Cochenilles',
] as const;

export const defectTypeLabels: Record<string, string> = {
  degats_oiseaux: 'Dégâts oiseaux',
  degats_chenilles: 'Dégâts chenilles',
  malformations: 'Malformations',
  mauvaise_fecondation: 'Mauvaise fécondation',
};
