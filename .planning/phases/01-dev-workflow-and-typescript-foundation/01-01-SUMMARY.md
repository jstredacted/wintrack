---
phase: 01-dev-workflow-and-typescript-foundation
plan: 01
subsystem: infra
tags: [typescript, vite, supabase, eslint, dev-workflow]

# Dependency graph
requires: []
provides:
  - develop branch for development workflow
  - TypeScript project references (tsconfig.app.json, tsconfig.node.json)
  - Supabase generated database types (src/lib/database.types.ts)
  - Vite env type declarations (src/vite-env.d.ts)
  - Dev tools env var gating (__DEV_TOOLS_ENABLED__)
  - ESLint coverage for .ts/.tsx files
affects: [01-dev-workflow-and-typescript-foundation]

# Tech tracking
tech-stack:
  added: [typescript ^5.9.3]
  patterns: [project-references, env-var-gating, supabase-type-generation]

key-files:
  created: [tsconfig.app.json, tsconfig.node.json, src/vite-env.d.ts, src/lib/database.types.ts, .env]
  modified: [package.json, tsconfig.json, vite.config.js, src/components/layout/AppShell.jsx, eslint.config.js]

key-decisions:
  - "Use __DEV_TOOLS_ENABLED__ Vite define constant for branch-based dev tools gating"
  - "TypeScript strict:false during migration, allowJs:true for coexistence"
  - "Generate Supabase types from live schema via CLI"

patterns-established:
  - "Project references: tsconfig.json references tsconfig.app.json + tsconfig.node.json"
  - "Env var gating: VITE_ENABLE_DEV_TOOLS controls dev tools visibility across environments"
  - "Type generation: supabase gen types typescript --linked > src/lib/database.types.ts"

requirements-completed: [DW-01, DW-02, DW-03, TS-02, TS-03]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 1 Plan 01: Dev Workflow & TypeScript Foundation Summary

**Develop branch with --host mobile testing, TypeScript project references (strict:false + allowJs), Supabase generated types, and __DEV_TOOLS_ENABLED__ env var gating**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T11:37:45Z
- **Completed:** 2026-03-16T11:40:45Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Created develop branch from main with --host flag for LAN mobile testing
- Configured TypeScript project references with strict:false and allowJs for incremental migration
- Generated Supabase database types from live schema (all tables typed)
- Gated dev tools behind VITE_ENABLE_DEV_TOOLS env var with Vite define constant
- Updated ESLint to cover .ts/.tsx files alongside .js/.jsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Create develop branch, add --host flag, install TypeScript** - `37d3600` (chore)
2. **Task 2: Configure TypeScript project references, vite-env.d.ts, Supabase types, dev tools env var gating** - `c48753c` (feat)
3. **Task 3: Update ESLint config for TypeScript files** - `5fd2777` (chore)

## Files Created/Modified
- `package.json` - Added --host to dev script, typecheck script, typescript dependency
- `tsconfig.json` - Replaced with project references root (no compilerOptions)
- `tsconfig.app.json` - App TypeScript config (strict:false, allowJs, react-jsx, bundler resolution)
- `tsconfig.node.json` - Node TypeScript config for vite/vitest config files
- `src/vite-env.d.ts` - Vite client type declarations with ImportMetaEnv interface
- `src/lib/database.types.ts` - Supabase generated database types for all tables
- `vite.config.js` - Added __DEV_TOOLS_ENABLED__ define block
- `src/components/layout/AppShell.jsx` - Changed dev tools gating from import.meta.env.DEV to __DEV_TOOLS_ENABLED__
- `.env` - Default VITE_ENABLE_DEV_TOOLS=true for local development
- `eslint.config.js` - Extended files glob to include .ts/.tsx, added __DEV_TOOLS_ENABLED__ global

## Decisions Made
- Used `__DEV_TOOLS_ENABLED__` Vite define constant (compile-time replacement) instead of runtime `import.meta.env.DEV` for branch-based dev tools gating
- Set `strict: false` and `allowJs: true` in tsconfig.app.json to allow incremental migration without error cascade
- Added `types: ["vitest/globals"]` to tsconfig.app.json to prevent TS errors on describe/it/expect in test files
- Generated Supabase types from live linked project rather than creating placeholder

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added __DEV_TOOLS_ENABLED__ as ESLint global**
- **Found during:** Task 3 (ESLint config update)
- **Issue:** After updating AppShell.jsx to use `__DEV_TOOLS_ENABLED__`, ESLint reported no-undef errors for the Vite define constant
- **Fix:** Added `__DEV_TOOLS_ENABLED__: 'readonly'` to ESLint globals configuration
- **Files modified:** eslint.config.js
- **Verification:** `bun run lint` no longer reports errors about __DEV_TOOLS_ENABLED__
- **Committed in:** 5fd2777 (Task 3 commit)

**2. [Rule 1 - Bug] Removed stray Supabase CLI output from generated types**
- **Found during:** Task 2 (Supabase type generation)
- **Issue:** `supabase gen types` wrote "Initialising login role..." to stdout before the type definitions
- **Fix:** Removed the stray line from the top of database.types.ts
- **Files modified:** src/lib/database.types.ts
- **Committed in:** c48753c (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- 2 pre-existing test failures in ConsistencyGraph.test.jsx (className.includes not a function) -- not caused by this plan's changes, not addressed

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TypeScript infrastructure ready for file-by-file migration (Plan 02+)
- Develop branch established as working branch
- All existing tests pass (except 2 pre-existing failures unrelated to this plan)

---
*Phase: 01-dev-workflow-and-typescript-foundation*
*Completed: 2026-03-16*
