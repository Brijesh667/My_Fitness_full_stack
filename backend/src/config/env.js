import 'dotenv/config';
import { z } from 'zod';

const bool = (defaultValue) =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECURE: bool('false'),
  CLOUDINARY_MOCK: bool('true'),
  CLOUDINARY_CLOUD_NAME: z.string().default('dummy_cloud_name'),
  CLOUDINARY_API_KEY: z.string().default('000000000000000'),
  CLOUDINARY_API_SECRET: z.string().default('dummy_api_secret'),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('myfitness/avatars'),
  RAG_MOCK: bool('true'),
  LLM_PROVIDER: z.enum(['gemini', 'openai', 'mock']).default('gemini'),
  LLM_API_KEY: z.string().default('dummy_llm_api_key'),
  LLM_MODEL: z.string().default('set_me_later'),
  EMBEDDING_MODEL: z.string().default('set_me_later'),
  EMBEDDING_DIMENSIONS: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : Number(value)),
    z.number().int().min(128).max(3072).optional()
  ),
  RAG_TOP_K: z.coerce.number().int().min(1).max(20).default(6),
  APP_TIMEZONE: z
    .string()
    .default('Asia/Kolkata')
    .refine((timeZone) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone }).format();
        return true;
      } catch {
        return false;
      }
    }, 'APP_TIMEZONE must be a valid IANA timezone'),
  ASSISTANT_DAILY_LIMIT: z.coerce.number().int().min(1).default(5),
  LOGIN_PAIR_LIMIT: z.coerce.number().int().min(1).default(5),
  LOGIN_IP_LIMIT: z.coerce.number().int().min(1).default(20),
  LOGIN_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
  SIGNUP_IP_LIMIT: z.coerce.number().int().min(1).default(5),
  SIGNUP_WINDOW_MINUTES: z.coerce.number().int().min(1).default(60),
  GLOBAL_IP_LIMIT: z.coerce.number().int().min(1).default(300),
  GLOBAL_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(200000).default(115000),
  ALLOW_MOCK_IN_PROD: bool('false'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(2),
  ENABLE_IP_DEBUG: bool('false')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  process.stderr.write(`Invalid environment configuration:\n${details}\n`);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.ALLOW_MOCK_IN_PROD) {
  const enabledMocks = [
    parsed.data.CLOUDINARY_MOCK ? 'CLOUDINARY_MOCK=true' : null,
    parsed.data.RAG_MOCK ? 'RAG_MOCK=true' : null
  ].filter(Boolean);

  if (enabledMocks.length) {
    process.stderr.write(
      `Refusing to start in production with mock providers enabled (${enabledMocks.join(
        ', '
      )}). Set real providers or ALLOW_MOCK_IN_PROD=true explicitly.\n`
    );
    process.exit(1);
  }
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
