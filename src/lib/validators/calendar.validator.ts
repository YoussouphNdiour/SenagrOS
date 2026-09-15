import { z } from 'zod';

// --- Stage schema (for template definition) ---

export const stageSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().positive(),
  durationDays: z.number().int().nonnegative(),
  actions: z.array(z.string()).default([]),
});

export type Stage = z.infer<typeof stageSchema>;

// --- Stage status schema (for parcel calendar instances) ---

export const stageStatusSchema = z.object({
  stageName: z.string().min(1),
  expectedDate: z.string().min(1),
  actualDate: z.string().nullable().default(null),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']).default('pending'),
});

export type StageStatus = z.infer<typeof stageStatusSchema>;

// --- List templates schema ---

export const listTemplatesSchema = z.object({
  cropType: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Create template schema ---

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  cropType: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  stages: z.array(stageSchema).min(1),
  totalDays: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export type CreateTemplateValues = z.input<typeof createTemplateSchema>;

// --- Update template schema ---

export const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  cropType: z.string().min(1).max(100).optional(),
  variety: z.string().max(100).optional(),
  stages: z.array(stageSchema).min(1).optional(),
  totalDays: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

// --- Delete template schema ---

export const deleteTemplateSchema = z.object({
  id: z.string().uuid(),
});

// --- List parcel calendars schema ---

export const listParcelCalendarsSchema = z.object({
  assetId: z.string().uuid().optional(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Assign to parcel schema ---

export const assignToParcelSchema = z.object({
  assetId: z.string().uuid(),
  calendarId: z.string().uuid(),
  sowingDate: z.string().min(1),
  expectedHarvestDate: z.string().optional(),
  actualHarvestDate: z.string().optional(),
  notes: z.string().optional(),
});

export type AssignToParcelValues = z.input<typeof assignToParcelSchema>;

// --- Update stage status schema ---

export const updateStageStatusSchema = z.object({
  parcelCalendarId: z.string().uuid(),
  stageName: z.string().min(1),
  actualDate: z.string().min(1),
  status: z.enum(['completed', 'skipped']).default('completed'),
});

// --- Get timeline schema ---

export const getTimelineSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cropType: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

// --- Helpers ---

/**
 * Calculate expected dates for each stage given a sowing date and stage definitions.
 */
export function calculateExpectedDates(
  sowingDate: string,
  stages: Stage[],
): StageStatus[] {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  let cumulativeDays = 0;
  const baseDate = new Date(sowingDate);

  return sorted.map((stage) => {
    const expectedDate = new Date(baseDate);
    expectedDate.setDate(expectedDate.getDate() + cumulativeDays);
    cumulativeDays += stage.durationDays;

    return {
      stageName: stage.name,
      expectedDate: expectedDate.toISOString().split('T')[0],
      actualDate: null,
      status: 'pending' as const,
    };
  });
}

/**
 * Calculate total cycle duration from stages.
 */
export function calculateTotalDays(stages: Stage[]): number {
  return stages.reduce((sum, s) => sum + s.durationDays, 0);
}

// --- Default stages by crop type ---

export const defaultStagesByCrop: Record<string, Stage[]> = {
  haricot_vert: [
    { name: 'Semis', order: 1, durationDays: 0, actions: ['preparation_sol', 'semis'] },
    { name: 'Levée', order: 2, durationDays: 7, actions: ['comptage_densite'] },
    { name: 'Croissance végétative', order: 3, durationDays: 25, actions: ['desherbage', 'fertilisation'] },
    { name: 'Floraison', order: 4, durationDays: 15, actions: ['observation_ravageurs'] },
    { name: 'Fructification', order: 5, durationDays: 20, actions: ['irrigation'] },
    { name: 'Maturité', order: 6, durationDays: 10, actions: ['agreage_prerecolte'] },
    { name: 'Récolte', order: 7, durationDays: 7, actions: ['recolte'] },
  ],
  oignon: [
    { name: 'Semis', order: 1, durationDays: 0, actions: ['preparation_sol', 'semis'] },
    { name: 'Levée', order: 2, durationDays: 10, actions: ['comptage_densite'] },
    { name: 'Croissance végétative', order: 3, durationDays: 40, actions: ['desherbage', 'fertilisation'] },
    { name: 'Bulbaison', order: 4, durationDays: 30, actions: ['irrigation', 'observation_ravageurs'] },
    { name: 'Maturité', order: 5, durationDays: 20, actions: ['arret_irrigation'] },
    { name: 'Récolte', order: 6, durationDays: 10, actions: ['recolte', 'sechage'] },
  ],
  tomate: [
    { name: 'Repiquage', order: 1, durationDays: 0, actions: ['preparation_sol', 'repiquage'] },
    { name: 'Reprise', order: 2, durationDays: 10, actions: ['irrigation'] },
    { name: 'Croissance végétative', order: 3, durationDays: 25, actions: ['tuteurage', 'fertilisation'] },
    { name: 'Floraison', order: 4, durationDays: 15, actions: ['observation_ravageurs'] },
    { name: 'Nouaison', order: 5, durationDays: 15, actions: ['irrigation'] },
    { name: 'Grossissement fruit', order: 6, durationDays: 20, actions: ['recolte_echelonnee'] },
    { name: 'Récolte', order: 7, durationDays: 20, actions: ['recolte', 'tri'] },
  ],
  riz: [
    { name: 'Semis/Repiquage', order: 1, durationDays: 0, actions: ['preparation_sol', 'semis'] },
    { name: 'Levée', order: 2, durationDays: 10, actions: ['comptage_densite'] },
    { name: 'Tallage', order: 3, durationDays: 30, actions: ['desherbage', 'fertilisation'] },
    { name: 'Montaison', order: 4, durationDays: 15, actions: ['observation_ravageurs'] },
    { name: 'Épiaison', order: 5, durationDays: 10, actions: ['irrigation'] },
    { name: 'Floraison', order: 6, durationDays: 7, actions: [] },
    { name: 'Maturité', order: 7, durationDays: 30, actions: ['arret_irrigation'] },
    { name: 'Récolte', order: 8, durationDays: 10, actions: ['recolte'] },
  ],
};

// --- Crop type labels ---

export const cropTypeLabels: Record<string, string> = {
  haricot_vert: 'Haricot vert',
  oignon: 'Oignon',
  tomate: 'Tomate',
  riz: 'Riz',
  mais: 'Maïs',
  mil: 'Mil',
  sorgho: 'Sorgho',
  arachide: 'Arachide',
  niebe: 'Niébé',
  pastèque: 'Pastèque',
  melon: 'Melon',
  gombo: 'Gombo',
  piment: 'Piment',
  aubergine: 'Aubergine',
  chou: 'Chou',
  laitue: 'Laitue',
  carotte: 'Carotte',
  patate_douce: 'Patate douce',
  manioc: 'Manioc',
};

// --- Stage status labels ---

export const stageStatusLabels: Record<string, string> = {
  pending: 'À venir',
  in_progress: 'En cours',
  completed: 'Terminé',
  skipped: 'Ignoré',
};

export const stageStatusColors: Record<string, string> = {
  pending: 'gray',
  in_progress: 'blue',
  completed: 'green',
  skipped: 'yellow',
};
