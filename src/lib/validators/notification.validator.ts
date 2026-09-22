import { z } from 'zod';

export const notificationTypeValues = ['stock_low', 'stage_delayed', 'task_assigned'] as const;

export const listNotificationsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  unreadOnly: z.boolean().default(false),
});

export const markReadSchema = z.object({
  id: z.string().uuid(),
});
