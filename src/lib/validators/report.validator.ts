import { z } from 'zod';

export const dashboardInputSchema = z.object({}).optional();

export const reportFilterSchema = z.object({
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const harvestReportSchema = z.object({
  season: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const financialsReportSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
