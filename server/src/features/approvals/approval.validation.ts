import { z } from 'zod';

export const approvalActionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Approval ID is required'),
  }),
  body: z.object({
    approved: z.boolean({ required_error: 'Decision (approved/rejected) is required' }),
    comment: z.string().max(1000).optional(),
  }),
});

export const getPendingApprovalsSchema = z.object({
  query: z.object({
    projectId: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
});
