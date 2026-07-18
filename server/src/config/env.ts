import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // AI Provider selection
  AI_PROVIDER: z.enum(['openai', 'gemini', 'groq', 'openrouter', 'mistral', 'github', 'deepseek', 'huggingface', 'googlecloud', 'azure', 'anthropic', 'langchain', 'ai21', 'perplexity']).default('openai'),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().default(''),
  GROQ_API_KEY: z.string().default(''),
  OPENROUTER_API_KEY: z.string().default(''),
  MISTRAL_API_KEY: z.string().default(''),
  GITHUB_MODELS_API_KEY: z.string().default(''),
  DEEPSEEK_API_KEY: z.string().default(''),
  HUGGINGFACE_API_KEY: z.string().default(''),
  GOOGLECLOUD_API_KEY: z.string().default(''),
  AZURE_API_KEY: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().default(''),
  LANGCHAIN_API_KEY: z.string().default(''),
  AI21_API_KEY: z.string().default(''),
  PERPLEXITY_API_KEY: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
