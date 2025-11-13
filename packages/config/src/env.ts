import { z } from 'zod';

export const sharedEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:4000/api'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Selfcheckout')
});

export type SharedEnv = z.infer<typeof sharedEnvSchema>;

export const loadSharedEnv = () => {
  const parsed = sharedEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid shared env: ${parsed.error.message}`);
  }
  return parsed.data;
};
