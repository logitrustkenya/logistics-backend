import { z } from 'zod';

// Google OAuth configuration schema
const googleAuthSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/auth/google/callback'),
});

// Validate Google OAuth environment variables
const googleAuthConfig = googleAuthSchema.safeParse({
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
});

export const isGoogleAuthConfigured = googleAuthConfig.success;

if (!isGoogleAuthConfigured) {
  console.warn('Google OAuth not fully configured:', googleAuthConfig.error?.issues);
}

export const googleAuthEnv = googleAuthConfig.success ? googleAuthConfig.data : null;

// Default configuration for development
export const googleAuthDefaults = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
};
