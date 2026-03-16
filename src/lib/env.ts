/**
 * Validated environment variables.
 *
 * Throws at module load time with a clear message if any required Vite env var
 * is missing. This surfaces as an app crash with a readable error in the
 * browser console rather than a cryptic Supabase "invalid input syntax for
 * type uuid: 'undefined'" error at runtime.
 *
 * In development: set values in .env.local
 * In production (Vercel): set values in Project Settings → Environment Variables
 */

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Add it to .env.local (dev) or Vercel environment variables (production). ` +
      `See .env.local.example for required variables.`
    );
  }
  return value;
}

export const USER_ID = requireEnv('VITE_USER_ID');
export const USER_JWT = requireEnv('VITE_USER_JWT');
export const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireEnv('VITE_SUPABASE_ANON_KEY');
