import { z } from 'zod';

export const createPlannedTaskSchema = z.object({
  planId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  type: z.string().max(50).optional().nullable(),
  growthStage: z.string().max(100).optional().nullable(),
  recurrenceType: z.string().max(20).optional().nullable(),
  recurrenceIntervalDays: z.number().int().positive().optional().nullable(),
  dayOffset: z.number().int().min(0).optional().default(0),
  plannedDate: z.string().datetime().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  status: z.enum(['planned', 'in_progress', 'done', 'skipped']).optional().default('planned'),
  inputs: z.array(z.object({
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  })).optional().default([]),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

export const updatePlannedTaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  type: z.string().max(50).optional().nullable(),
  dayOffset: z.number().int().min(0).optional(),
  plannedDate: z.string().datetime().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  status: z.enum(['planned', 'in_progress', 'done', 'skipped']).optional(),
  inputs: z.array(z.object({
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  })).optional(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const listPlannedTasksSchema = z.object({
  planId: z.string().uuid(),
});

export const deletePlannedTaskSchema = z.object({
  id: z.string().uuid(),
});
