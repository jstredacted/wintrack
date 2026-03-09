---
phase: 01-foundation
plan: "02"
subsystem: database
tags: [supabase, postgres, rls, jwt, sql, date-utility]

requires:
  - phase: 01-foundation/01-01
    provides: Vitest test scaffold and date.test.js stubs

provides:
  - Supabase migration SQL with wins, check_ins, journal_entries tables and 12 RLS policies
  - JWT generation script (no npm deps, Node built-in crypto)
  - Supabase client singleton using accessToken pattern
  - getLocalDateString() local-timezone date utility (YYYY-MM-DD via en-CA locale)

affects:
  - 02-wins-crud
  - 03-check-ins
  - 04-journal
  - 05-streak

tech-stack:
  added: []
  patterns:
    - "accessToken pattern: Supabase client uses accessToken: async () => USER_JWT — auth.* methods are intentionally broken"
    - "win_date as text column: client sets YYYY-MM-DD using getLocalDateString() to avoid timezone math in SQL"
    - "getLocalDateString: Intl.DateTimeFormat en-CA locale for local YYYY-MM-DD — never .toISOString().slice(0,10)"

key-files:
  created:
    - supabase/migrations/001_initial_schema.sql
    - scripts/gen-jwt.mjs
    - .env.local.example
    - src/lib/supabase.js
    - src/lib/utils/date.js
  modified: []

key-decisions:
  - "win_date stored as text (YYYY-MM-DD) set by client — avoids timezone math in SQL streak queries"
  - "RLS uses separate policies per operation (not FOR ALL) — correct WITH CHECK semantics per Supabase docs"
  - "JWT is static 10-year token generated once and stored in .env.local — no auth flows needed"
  - "Supabase client uses accessToken option with static JWT — auth.* methods intentionally disabled"

patterns-established:
  - "Pattern: All date strings use getLocalDateString() — the only date primitive in this codebase"
  - "Pattern: Supabase client singleton exported from src/lib/supabase.js — no other instantiations"
  - "Pattern: Never call supabase.auth.* — identify user from import.meta.env.VITE_USER_ID directly"

requirements-completed:
  - SHELL-01
  - SHELL-02

duration: 5min
completed: 2026-03-09
---

# Phase 1 Plan 02: Supabase Schema, JWT Script, Client, and Date Utility Summary

**Supabase schema with 3 tables and 12 RLS policies, static JWT generation via Node built-in crypto, and Intl.DateTimeFormat-based local date utility**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-09T21:10:00Z
- **Completed:** 2026-03-09T21:15:00Z
- **Tasks:** 2 of 3 automated tasks (Task 3 is human checkpoint)
- **Files modified:** 5

## Accomplishments

- getLocalDateString() implemented with Intl.DateTimeFormat en-CA locale — all 3 tests green
- Supabase migration SQL with wins (including win_date and timer columns), check_ins, and journal_entries tables, each with 4 per-operation RLS policies (12 total)
- gen-jwt.mjs generates a static 10-year JWT using only Node built-in crypto (no npm install needed)
- Supabase client singleton using accessToken pattern — auth.* methods intentionally non-functional

## Task Commits

Each task was committed atomically:

1. **Task 1: Create date utility and pass its tests** - `92087a6` (feat)
2. **Task 2: Write Supabase migration SQL and client setup files** - `7ac7cc3` (feat)
3. **Task 3: Apply Supabase migration and create .env.local** - awaiting human action (checkpoint)

## Files Created/Modified

- `src/lib/utils/date.js` - getLocalDateString() using Intl.DateTimeFormat en-CA locale
- `supabase/migrations/001_initial_schema.sql` - 3 tables with 12 RLS policies and win_date column
- `scripts/gen-jwt.mjs` - one-time JWT generation using Node built-in crypto
- `.env.local.example` - template for local environment setup (committed to git)
- `src/lib/supabase.js` - Supabase client singleton with accessToken: async () => USER_JWT

## Decisions Made

- win_date is stored as text (YYYY-MM-DD) set by the client using getLocalDateString() — avoids timezone math in SQL for streak queries
- RLS policies are written as separate per-operation policies (not FOR ALL) — ensures correct WITH CHECK semantics on INSERT/UPDATE per Supabase docs
- JWT is a static 10-year token generated once; refreshes are unnecessary for a single-user personal tool
- The supabase.auth.* API is intentionally disabled — user identity comes from VITE_USER_ID env var

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Task 3 is a human-action checkpoint. Before feature development can begin, you must:

1. Get Supabase credentials: Project Settings -> API -> Project URL and anon public key
2. Run the migration: SQL Editor -> paste `supabase/migrations/001_initial_schema.sql` -> Run
3. Generate JWT: `SUPABASE_JWT_SECRET=<from-dashboard> node scripts/gen-jwt.mjs`
4. Create `.env.local`: copy `.env.local.example`, fill in all four values

See Task 3 checkpoint instructions for full step-by-step details.

## Next Phase Readiness

- Date utility ready for use across all feature phases (streak logic depends on getLocalDateString())
- Supabase client ready for import once .env.local is configured
- Schema ready to apply — no feature development should begin until Task 3 (migration + .env.local) is complete
- Blockers from STATE.md resolved: RLS posture (Option B: hardcoded UUID + RLS USING auth.uid() = user_id) and timer_started_at column (included in schema for wall-clock recovery)

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
