import { z } from 'zod';

export const envValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive(),
  TIMEZONE: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  POSTGRES_PASSWORD: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  ANTHROPIC_API_KEY: z.string().min(1),
  IA_MODEL: z.string().min(1).default('claude-sonnet-4-6'),
  IA_MAX_TOKENS: z.coerce.number().int().positive().default(800),
  IA_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.2),
  IA_PROMPT_CACHE_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  IA_SUMMARY_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(1800),
  IA_SUMMARY_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  IA_SUMMARY_RATE_LIMIT_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(3600),
  IA_HYBRID_SUMMARY_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  IA_HYBRID_MAX_TOKENS: z.coerce.number().int().positive().default(350),
  IA_WEEKLY_BATCH_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  IA_WEEKLY_BATCH_INTERVAL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(86400),
});

export type EnvVariables = z.infer<typeof envValidationSchema>;

export function validateEnv(config: Record<string, unknown>): EnvVariables {
  const parsedConfig = envValidationSchema.safeParse(config);

  if (!parsedConfig.success) {
    const errors = parsedConfig.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid environment variables: ${errors}`);
  }

  return parsedConfig.data;
}
