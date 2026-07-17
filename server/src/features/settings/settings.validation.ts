import { z } from 'zod';

export const executionModeEnum = z.enum(['AUTO', 'MANUAL']);

export const updateExecutionModeSchema = z.object({
  body: z.object({
    executionMode: executionModeEnum,
  }),
});
