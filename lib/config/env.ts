import { z } from 'zod';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email(),
    SESSION_SECRET: z.string().min(32),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    SESSION_COOKIE_MAX_AGE: z.string().regex(/^\\d+$/).transform(Number),
    PORT: z.string().regex(/^\\d+$/).transform(Number).default('3000'),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
    logger.error('Environment variable validation failed:', env.error);
    process.exit(1);
}

export default env.data;
