import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY, USER_JWT } from "@/lib/env";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: async () => USER_JWT,
  // WARNING: supabase.auth.* methods WILL throw — this is by design.
  // Never call supabase.auth.getUser() or supabase.auth.onAuthStateChange() in this project.
  // Identify the current user from USER_ID in @/lib/env directly.
});
