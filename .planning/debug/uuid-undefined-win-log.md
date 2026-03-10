---
status: investigating
trigger: "After Vercel deployed the latest commit, logging a win produces a Supabase error: invalid input syntax for type uuid: 'undefined'"
created: 2026-03-10T00:00:00Z
updated: 2026-03-10T00:15:00Z
---

## Current Focus

hypothesis: VITE_USER_JWT set in Vercel has a different sub claim UUID than the VITE_USER_ID set in Vercel — they must be a matched pair from the same gen-jwt.mjs run; OR the JWT is missing role: "authenticated" so Supabase treats the request as anon (no anon INSERT policy exists)
test: Inspect the VITE_USER_JWT value in Vercel: decode its payload (middle base64url segment) and confirm sub matches VITE_USER_ID exactly
expecting: Either a UUID mismatch (sub ≠ VITE_USER_ID) or a missing/wrong role claim
next_action: Guide user to verify JWT sub vs VITE_USER_ID, then run gen-jwt.mjs fresh and set both values together if mismatched

## Symptoms

expected: Logging a win saves it to Supabase successfully
actual: Supabase returns "invalid input syntax for type uuid: 'undefined'" after submitting a win
errors: "invalid input syntax for type uuid: 'undefined'"
reproduction: Deploy latest commit to Vercel, open app, click "Log a win", submit
started: After the latest commit was deployed to Vercel

## Eliminated

- hypothesis: Bug introduced by the SideNav layout refactor (AppShell, SideNav, BottomTabBar removal)
  evidence: AppShell is clean (14 lines, no USER_ID reference); git diff shows only layout/nav files changed — no hooks or data layer touched
  timestamp: 2026-03-10T00:03:00Z

- hypothesis: useWins addWin passes wrong field to Supabase
  evidence: useWins.js line 97 — insert payload uses USER_ID which is the module-level constant; the field name and value are correct when VITE_USER_ID is defined
  timestamp: 2026-03-10T00:04:00Z

## Evidence

- timestamp: 2026-03-10T00:14:00Z
  checked: supabase-js 2.98.0 dist/index.mjs
  found: accessToken option IS supported — return value is set as Authorization: Bearer <token> on every request; Supabase PostgREST derives auth.uid() from the sub claim in this Bearer JWT
  implication: The client-side mechanism is correct. RLS failure means the JWT sub claim does not match VITE_USER_ID, OR role is not "authenticated"

- timestamp: 2026-03-10T00:14:00Z
  checked: scripts/gen-jwt.mjs
  found: Script generates a fresh random UUID via crypto.randomUUID() and embeds it as both the sub claim and prints it as VITE_USER_ID — the two values must always be set together as a matched pair
  implication: If user regenerated the JWT separately or set mismatched values in Vercel, sub ≠ user_id → RLS fails

- timestamp: 2026-03-10T00:01:00Z
  checked: useWins.js line 5
  found: const USER_ID = import.meta.env.VITE_USER_ID — read at module load (build time / initial runtime evaluation)
  implication: If VITE_USER_ID is not in Vercel env vars, this is undefined for all Supabase calls

- timestamp: 2026-03-10T00:02:00Z
  checked: .env.local (gitignored), .env.local.example
  found: VITE_USER_ID and VITE_USER_JWT are only defined locally in .env.local — no vercel.json or other mechanism injects them into Vercel builds
  implication: Vercel builds without these vars → USER_ID = undefined → string "undefined" sent to Supabase UUID column

- timestamp: 2026-03-10T00:03:00Z
  checked: All four hooks (useWins, useCheckin, useJournal, useStreak) and lib/supabase.js
  found: All four hooks use the same top-level const USER_ID = import.meta.env.VITE_USER_ID pattern; supabase.js uses VITE_USER_JWT for accessToken
  implication: ALL Supabase operations are broken in production — reads, writes, streaks, journal, check-ins

- timestamp: 2026-03-10T00:04:00Z
  checked: git log (recent commits e6ddfc8, 3294fe3, etc.)
  found: Recent commits only touched layout/nav components — no data layer changes
  implication: This was always broken on Vercel if vars were never added; the latest deploy just surfaced it (or Vercel env vars were accidentally removed/never set)

## Resolution

root_cause: VITE_USER_ID and VITE_USER_JWT are not set as environment variables in the Vercel project dashboard. Vite's import.meta.env.VITE_USER_ID evaluates to undefined in production builds, which becomes the literal string "undefined" when interpolated into Supabase queries. Supabase rejects "undefined" as an invalid UUID, causing every insert/query with user_id to fail.

fix:
  1. Created src/lib/env.js — central module that reads all four VITE_ env vars and throws an informative error immediately at module load if any are missing, instead of silently passing "undefined" to Supabase.
  2. Updated src/lib/supabase.js, src/hooks/useWins.js, useCheckin.js, useJournal.js, useStreak.js to import USER_ID (and related vars) from @/lib/env instead of reading import.meta.env directly in each file.
  3. Updated vitest.config.js to provide dummy env values for tests so the requireEnv guard does not throw during test execution.
  4. Required action: Set VITE_USER_ID, VITE_USER_JWT, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY in Vercel dashboard → Project Settings → Environment Variables using the values from .env.local.

verification: 131/131 tests pass. Pending Vercel env var configuration + human verification of win logging in production.
files_changed:
  - src/lib/env.js (new file)
  - src/lib/supabase.js (import from env.js)
  - src/hooks/useWins.js (import USER_ID from env.js)
  - src/hooks/useCheckin.js (import USER_ID from env.js)
  - src/hooks/useJournal.js (import USER_ID from env.js)
  - src/hooks/useStreak.js (import USER_ID from env.js)
  - vitest.config.js (add test env values)
