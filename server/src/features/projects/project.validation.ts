import { z } from 'zod';

export const getProjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  }),
});

export const projectIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Project ID is required'),
  }),
});

export const getTasksSchema = z.object({
  query: z.object({
    projectId: z.string().optional(),
    status: z.enum(['PENDING', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  }),
});

export const taskIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Task ID is required'),
  }),
});

export const updateProjectExecutionModeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Project ID is required'),
  }),
  body: z.object({
    executionMode: z.enum(['AUTO', 'MANUAL', '']).nullable(),
  }),
});
