import { z } from 'zod';

export const delegateSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    goal: z.string().min(10, 'Goal must be at least 10 characters').max(5000),
    description: z.string().max(2000).optional(),
    workflowType: z.string().max(100).optional(),
  }),
});

export const projectStatusSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
  }),
});
