import { config as loadEnv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '../../../.env')
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  AI_TEXT_PROVIDER: z.enum(['gemini', 'openai']).optional(),
  AI_IMAGE_PROVIDER: z.enum(['gemini', 'openai']).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_TEXT_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_IMAGE_MODEL: z.string().default('gemini-2.5-flash-image'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_TEXT_MODEL: z.string().default('gpt-5.2'),
  OPENAI_IMAGE_MODEL: z.string().default('gpt-image-1-mini'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['LOCAL', 'S3']).default('LOCAL'),
  LOCAL_STORAGE_PATH: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().email().default('founder@selfpayout.com'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).optional()
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === 'production';
