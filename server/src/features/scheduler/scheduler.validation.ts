import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200),
    description: z.string().max(1000).optional(),
    workflowId: z.string().min(1, 'Workflow ID is required'),
    input: z.record(z.any()).optional(),
    cronExpression: z.string().min(5, 'Cron expression is required'),
    scheduleDescription: z.string().max(200).optional(),
  }),
});

export const jobIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Job ID is required'),
  }),
});

export const listJobsSchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
});
