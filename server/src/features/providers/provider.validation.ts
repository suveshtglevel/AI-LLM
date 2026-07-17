import { z } from 'zod';

export const apiKeySchema = z.object({
  key: z.string().min(1, 'API key is required'),
  isActive: z.boolean().default(true),
});

export const createProviderSchema = z.object({
  name: z.string().min(1, 'Provider name is required').transform((n) => n.toLowerCase()),
  displayName: z.string().min(1, 'Display name is required'),
  providerType: z.string().min(1, 'Provider type is required'),
  apiKeys: z.array(apiKeySchema).min(1, 'At least one API key is required'),
  baseUrl: z.string().url('Invalid base URL'),
  models: z.array(z.string()).optional().default([]),
  defaultModel: z.string().optional().default(''),
  isEnabled: z.boolean().optional().default(true),
});

export const updateProviderSchema = z.object({
  displayName: z.string().min(1).optional(),
  providerType: z.string().min(1).optional(),
  apiKeys: z.array(apiKeySchema).min(1).optional(),
  baseUrl: z.string().url().optional(),
  models: z.array(z.string()).optional(),
  defaultModel: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export const addApiKeySchema = z.object({
  key: z.string().min(1, 'API key is required'),
});
