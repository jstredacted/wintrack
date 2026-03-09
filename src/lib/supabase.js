import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const USER_JWT = import.meta.env.VITE_USER_JWT;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: async () => USER_JWT,
  // WARNING: supabase.auth.* methods WILL throw — this is by design.
  // Never call supabase.auth.getUser() or supabase.auth.onAuthStateChange() in this project.
  // Identify the current user from import.meta.env.VITE_USER_ID directly.
});
