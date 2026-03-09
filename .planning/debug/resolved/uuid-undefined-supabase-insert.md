---
status: resolved
trigger: "invalid input syntax for type uuid: 'undefined' when logging a win — user_id is the string 'undefined' in the Supabase insert"
created: 2026-03-09T00:00:00Z
updated: 2026-03-09T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED — VITE_USER_ID was missing from .env.local, causing import.meta.env.VITE_USER_ID to resolve to undefined, which Supabase coerces to the string "undefined" on insert
test: read .env.local and verify VITE_USER_ID is now present with a valid UUID
expecting: win insert succeeds after dev server restart
next_action: await human verification

## Symptoms

expected: Clicking "Log a win" creates a win row in Supabase and shows it in the list
actual: Supabase insert fails with "invalid input syntax for type uuid: 'undefined'" — nothing is saved, nothing appears in the list
errors: "invalid input syntax for type uuid: 'undefined'"
reproduction: Open TodayPage, click the Log a win / + button, type a title, press Enter
started: First run after Phase 2 implementation — never worked

## Eliminated

- hypothesis: user_id sourced from Supabase auth session and session is uninitialized
  evidence: supabase.js explicitly disables auth methods; USER_ID is read directly from import.meta.env.VITE_USER_ID — no session involved
  timestamp: 2026-03-09T00:01:00Z

## Evidence

- timestamp: 2026-03-09T00:01:00Z
  checked: src/hooks/useWins.js line 5
  found: const USER_ID = import.meta.env.VITE_USER_ID — module-level constant, evaluated once at import time
  implication: if VITE_USER_ID is absent from .env.local, USER_ID is undefined for the entire session

- timestamp: 2026-03-09T00:01:00Z
  checked: .env.local before fix
  found: file contained VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET — but NOT VITE_USER_ID or VITE_USER_JWT
  implication: import.meta.env.VITE_USER_ID resolves to undefined; Vite stringifies it to "undefined" when it reaches the Supabase client insert payload

- timestamp: 2026-03-09T00:01:00Z
  checked: scripts/gen-jwt.mjs
  found: script reads SUPABASE_JWT_SECRET (already in .env.local), generates a UUID for userId, then prints both VITE_USER_ID and VITE_USER_JWT
  implication: the script was never run, so its output was never added to .env.local

- timestamp: 2026-03-09T00:01:00Z
  checked: .env.local after fix
  found: VITE_USER_ID=b12db6e1-c4b0-4143-9820-80b7fd337278 and VITE_USER_JWT=<signed JWT> appended successfully
  implication: after dev server restart, import.meta.env.VITE_USER_ID will be a valid UUID

## Resolution

root_cause: VITE_USER_ID and VITE_USER_JWT were never added to .env.local. The gen-jwt.mjs script (which generates them from SUPABASE_JWT_SECRET) was documented in .env.local.example but was not run during Phase 2 setup. As a result, import.meta.env.VITE_USER_ID was undefined at runtime, and Supabase serialized it as the string "undefined" in the insert payload, which Postgres rejected as an invalid UUID.
fix: Ran `SUPABASE_JWT_SECRET=<secret> node scripts/gen-jwt.mjs` and appended the output (VITE_USER_ID and VITE_USER_JWT) to .env.local.
verification: human confirmed fixed — win insert succeeds after dev server restart with VITE_USER_ID present
files_changed:
  - .env.local (appended VITE_USER_ID and VITE_USER_JWT)
