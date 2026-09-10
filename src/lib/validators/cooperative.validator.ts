import { z } from 'zod';

// --- Enums ---

export const cooperativeRoleEnum = z.enum(['admin', 'member']);
export type CooperativeRole = z.infer<typeof cooperativeRoleEnum>;

export const cooperativeRoleLabels: Record<CooperativeRole, string> = {
  admin: 'Administrateur',
  member: 'Membre',
};

export const cooperativeTypeEnum = z.enum(['cooperative', 'gie', 'association', 'union']);
export type CooperativeType = z.infer<typeof cooperativeTypeEnum>;

export const cooperativeTypeLabels: Record<CooperativeType, string> = {
  cooperative: 'Coopérative',
  gie: 'GIE',
  association: 'Association',
  union: 'Union',
};

// --- Schemas ---

export const createCooperativeSchema = z.object({
  name: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  description: z.string().optional(),
  region: z.string().optional(),
  type: cooperativeTypeEnum.default('cooperative'),
});

export type CreateCooperativeValues = z.input<typeof createCooperativeSchema>;

export const updateCooperativeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  region: z.string().optional(),
  type: cooperativeTypeEnum.optional(),
});

export type UpdateCooperativeValues = z.input<typeof updateCooperativeSchema>;

export const cooperativeIdSchema = z.object({
  cooperativeId: z.string().uuid(),
});

export const inviteToCooperativeSchema = z.object({
  cooperativeId: z.string().uuid(),
  farmId: z.string().uuid(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token requis'),
});

export const listCooperativesSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
});

export type ListCooperativesValues = z.input<typeof listCooperativesSchema>;

export const cooperativeDashboardSchema = z.object({
  cooperativeId: z.string().uuid(),
});
