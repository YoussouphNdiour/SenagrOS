import { z } from 'zod';

// --- Plan type & status enums ---

export const planTypeEnum = z.enum(['crop', 'grazing', 'harvest', 'pv_maintenance']);
export type PlanType = z.infer<typeof planTypeEnum>;

export const planStatusEnum = z.enum(['active', 'completed', 'cancelled']);
export type PlanStatus = z.infer<typeof planStatusEnum>;

// --- Labels ---

export const planTypeLabels: Record<PlanType, string> = {
  crop: 'Culture',
  grazing: 'Pâturage',
  harvest: 'Récolte',
  pv_maintenance: "Entretien PV",
};

export const planStatusLabels: Record<PlanStatus, string> = {
  active: 'Actif',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export const seasonLabels: Record<string, string> = {
  hivernage: 'Hivernage (Jun-Oct)',
  contre_saison_chaude: 'Contre-saison chaude (Mar-Jun)',
  contre_saison_froide: 'Contre-saison froide (Nov-Feb)',
};

// --- List plans schema ---

export const listPlansSchema = z.object({
  type: planTypeEnum.optional(),
  status: planStatusEnum.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// --- Create plan schema ---

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  type: planTypeEnum,
  season: z.string().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePlanValues = z.input<typeof createPlanSchema>;

// --- Update plan schema ---

export const updatePlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  type: planTypeEnum.optional(),
  status: planStatusEnum.optional(),
  season: z.string().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdatePlanValues = z.input<typeof updatePlanSchema>;

// --- Delete / getById schema ---

export const planIdSchema = z.object({
  id: z.string().uuid(),
});

// --- Add/remove log to plan ---

export const planLogSchema = z.object({
  planId: z.string().uuid(),
  logId: z.string().uuid(),
});
