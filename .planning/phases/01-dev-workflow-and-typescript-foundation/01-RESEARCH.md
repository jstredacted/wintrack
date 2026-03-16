# Phase 1: Dev Workflow & TypeScript Foundation - Research

**Researched:** 2026-03-16
**Domain:** TypeScript migration, Git branching strategy, Vite dev server configuration, Supabase type generation
**Confidence:** HIGH

## Summary

Phase 1 covers two distinct areas: (1) establishing a `develop` branch with branch-aware dev tools, and (2) migrating the entire codebase from JavaScript to TypeScript including Supabase type generation.

The codebase is 5,573 LOC across 65 files (40 source + 25 test). TypeScript is already partially set up -- `@types/react` and `@types/react-dom` are installed, a minimal `tsconfig.json` exists with just path aliases, and Vite 7.x natively transpiles `.tsx` via esbuild. The Supabase CLI (v2.75.0) is installed and linked to project `zwolbvnwybtjtgqrwolw`, so type generation is a single command.

**Primary recommendation:** Set up the develop branch and --host flag first (quick wins), then do the TypeScript migration file-by-file starting with leaf modules, and finish with Supabase type generation and strict mode.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DW-01 | Develop branch created from main as primary development branch | Git branching section -- create `develop` from `main`, set as default working branch |
| DW-02 | Dev tools (DevToolsPanel, Ctrl+Shift+D) only render on develop branch, stripped from main | Branch-gating pattern using Vite `define` or environment variable at build time |
| DW-03 | Vite dev server runs with `--host` for mobile testing on local network | Simple `--host` flag on dev script in package.json |
| TS-01 | All existing .jsx/.js source files converted to .tsx/.ts | File-by-file rename strategy -- 40 source files + 25 test files |
| TS-02 | Supabase database types generated for all tables | `supabase gen types typescript --linked` with project ref `zwolbvnwybtjtgqrwolw` |
| TS-03 | All new code written in TypeScript from day one | Enforced by tsconfig + ESLint config update to include .ts/.tsx |
| TS-04 | tsconfig.json configured with strict mode enabled after full migration | Two-step: `strict: false` during migration, flip to `strict: true` after all files converted |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `typescript` | ^5.8 | Type checking, IDE intelligence | Already have `@types/react` ^19.2.7 and `@types/react-dom` ^19.2.3 installed. Vite 7.x transpiles .tsx natively via esbuild. Dev-only dependency. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase CLI | 2.75.0 (installed) | Generate database TypeScript types | One-time generation, then regenerate when schema changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual type writing for DB | Supabase CLI gen types | CLI generates from live schema -- always accurate, zero maintenance |
| `ts-migrate` codemod | Manual file-by-file | At 40 source files, manual produces cleaner types than automated `any` injection |
| `vite-tsconfig-paths` | tsconfig `paths` + vite `resolve.alias` | Already have vite alias; tsconfig paths gives IDE support. No extra dependency needed. |

**Installation:**
```bash
bun add -D typescript
```

## Architecture Patterns

### Recommended Project Structure (post-migration)
```
src/
├── components/        # .tsx files (React components)
├── hooks/             # .ts files (custom hooks)
├── lib/               # .ts files (utilities, supabase client)
│   └── database.types.ts  # Generated Supabase types
├── pages/             # .tsx files (route pages)
├── stores/            # .ts files (Zustand stores)
├── App.tsx
├── main.tsx
├── sw.ts              # Service worker (if TS-compatible, otherwise keep .js)
├── vite-env.d.ts      # Vite client type declarations
└── test-setup.ts
```

### Pattern 1: Branch-Based Dev Tools Gating (DW-02)

**What:** DevToolsPanel must render ONLY on the develop branch, not on main (production). The current approach uses `import.meta.env.DEV` which gates on dev vs production mode, NOT on branch.

**When to use:** Any dev-only feature that should never appear in production deploys from main.

**Approach:** Use a Vite `define` constant set via environment variable. On Vercel, set `VITE_ENABLE_DEV_TOOLS=false` for the main/production branch. On develop branch deployments (or local dev), set it to `true`.

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    __DEV_TOOLS_ENABLED__: JSON.stringify(
      process.env.VITE_ENABLE_DEV_TOOLS === 'true' || process.env.NODE_ENV !== 'production'
    ),
  },
  // ...
})

// src/components/layout/AppShell.tsx
{__DEV_TOOLS_ENABLED__ && (
  <DevToolsPanel open={devToolsOpen} onClose={closeDevTools} />
)}
```

**Alternative (simpler):** Use `import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true'` directly. Vite statically replaces `import.meta.env.*` at build time, so when the var is unset or false, the DevToolsPanel code tree-shakes away in production builds.

**Key insight:** The current `import.meta.env.DEV` check already strips dev tools from production builds. The requirement says "only on develop branch" -- the simplest interpretation is: dev tools appear in local development AND develop branch preview deploys, but NOT in production deploys from main. This is achieved by setting `VITE_ENABLE_DEV_TOOLS=true` as an environment variable on develop branch only (Vercel supports per-branch env vars).

### Pattern 2: TypeScript Config with Project References

**What:** Separate configs for app code (browser) and node code (vite.config).

**Example:**

`tsconfig.json` (root -- references only):
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "allowJs": true,
    "strict": false,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

### Pattern 3: Supabase Type Generation

**What:** Generate TypeScript types from the live database schema.

**Command:**
```bash
supabase gen types typescript --linked --schema public > src/lib/database.types.ts
```

**Usage in supabase client:**
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: async () => USER_JWT,
})
```

This gives fully typed `.from('wins').select('*')` responses -- no more `any` from Supabase queries.

### Pattern 4: Vite Environment Type Declarations

**What:** A `vite-env.d.ts` file that tells TypeScript about `import.meta.env` variables.

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USER_ID: string
  readonly VITE_USER_JWT: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENABLE_DEV_TOOLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global constant injected by Vite define
declare const __DEV_TOOLS_ENABLED__: boolean
```

### Anti-Patterns to Avoid
- **Big-bang rename:** Do NOT rename all 65 files at once. TypeScript errors cascade and become impossible to debug. Rename leaf files first, work inward.
- **Using `any` everywhere:** Resist the urge to `as any` through the migration. Use `unknown` and narrow, or define proper types. The point of migrating is to get type safety.
- **Importing .tsx extensions in source:** Vite resolves extensions automatically. Write `import App from './App'` not `import App from './App.tsx'`. The `allowImportingTsExtensions` flag is for tsconfig path resolution, not for import statements.
- **Gating dev tools on `import.meta.env.MODE`:** This varies by Vite mode, not by branch. Use an explicit env var for branch-based gating.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database types | Manual interface definitions for each table | `supabase gen types typescript --linked` | Generates from live schema, stays in sync, covers all tables/views |
| Vite env type safety | Runtime checks for every env var | `vite-env.d.ts` with `ImportMetaEnv` interface | Compile-time safety, IDE autocomplete |
| Path alias resolution | Custom module resolution | tsconfig `paths` + existing vite `resolve.alias` | Standard approach, zero config beyond what exists |

## Common Pitfalls

### Pitfall 1: index.html Script Source
**What goes wrong:** After renaming `main.jsx` to `main.tsx`, the app fails to load because `index.html` still references `/src/main.jsx`.
**Why it happens:** `index.html` is the real entry point, not a Vite config file.
**How to avoid:** Update `<script type="module" src="/src/main.tsx">` in `index.html` immediately after renaming.
**Warning signs:** Blank page, 404 in browser console.

### Pitfall 2: Service Worker TypeScript Compatibility
**What goes wrong:** `sw.js` uses Workbox imports and `self.__WB_MANIFEST` which needs special typing.
**Why it happens:** Service workers run in a different global scope (`ServiceWorkerGlobalScope`, not `Window`).
**How to avoid:** Either keep `sw.js` as-is (it's built separately by vite-plugin-pwa) or add a `/// <reference lib="webworker" />` triple-slash directive. The SW file is processed by vite-plugin-pwa's `injectManifest` strategy separately from the main app. Safest to keep as `.js` initially.
**Warning signs:** TypeScript errors about `self` type, `__WB_MANIFEST` not found.

### Pitfall 3: ESLint Config Not Updated for TypeScript
**What goes wrong:** ESLint only processes `**/*.{js,jsx}` (current config) and ignores all new `.ts/.tsx` files.
**Why it happens:** The current `eslint.config.js` explicitly limits file matching.
**How to avoid:** Update the `files` glob to `['**/*.{js,jsx,ts,tsx}']` and consider adding `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`.
**Warning signs:** Linting passes but TypeScript files have no lint coverage.

### Pitfall 4: Vitest Config Needs TypeScript Extension Update
**What goes wrong:** `vitest.config.js` references `./src/test-setup.js` -- after renaming, tests fail to find setup file.
**Why it happens:** Hard-coded file paths in config.
**How to avoid:** Rename `vitest.config.js` to `vitest.config.ts` and update `setupFiles` path after renaming `test-setup.js`.
**Warning signs:** Test suite fails immediately with "cannot find module" for setup file.

### Pitfall 5: JSX Pragma in Renamed Files
**What goes wrong:** Renamed `.tsx` files that use JSX but don't import React produce errors in strict mode.
**Why it happens:** With `"jsx": "react-jsx"` in tsconfig, React is auto-imported. But if tsconfig is misconfigured, it falls back to classic JSX transform.
**How to avoid:** Verify `"jsx": "react-jsx"` is set in tsconfig.app.json. This matches what `@vitejs/plugin-react` uses.
**Warning signs:** "React is not defined" errors.

### Pitfall 6: Test Files Need Type Declarations for Vitest Globals
**What goes wrong:** TypeScript reports errors for `describe`, `it`, `expect`, `vi` in test files.
**Why it happens:** Vitest globals are enabled (`globals: true` in vitest config) but TypeScript doesn't know about them.
**How to avoid:** Add `"types": ["vitest/globals"]` to `compilerOptions` in `tsconfig.app.json`, or create a separate `tsconfig.test.json`.
**Warning signs:** Red squiggles on every test function.

## Code Examples

### Typed Supabase Client
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { SUPABASE_URL, SUPABASE_ANON_KEY, USER_JWT } from '@/lib/env'

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: async () => USER_JWT,
})
```

### Typed Environment Variables
```typescript
// src/lib/env.ts
function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Add it to .env.local (dev) or Vercel environment variables (production).`
    )
  }
  return value
}

export const USER_ID = requireEnv('VITE_USER_ID')
export const USER_JWT = requireEnv('VITE_USER_JWT')
export const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL')
export const SUPABASE_ANON_KEY = requireEnv('VITE_SUPABASE_ANON_KEY')
```

### Typed Zustand Store
```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'
import { getLocalDateString } from '@/lib/utils/date'

interface UIState {
  inputOverlayOpen: boolean
  editingWinId: string | null
  rollForwardOfferedDate: string | null
  streakRefreshKey: number
  devToolsOpen: boolean
  openInputOverlay: () => void
  closeInputOverlay: () => void
  setEditingWin: (id: string) => void
  clearEditingWin: () => void
  markRollForwardOffered: (dayStartHour: number) => void
  refreshStreak: () => void
  toggleDevTools: () => void
  closeDevTools: () => void
}

export const useUIStore = create<UIState>((set) => ({
  // ... same implementation, now typed
}))
```

### Typed Custom Hook Return
```typescript
// src/hooks/useWins.ts
import type { Database } from '@/lib/database.types'

type Win = Database['public']['Tables']['wins']['Row']

interface UseWinsReturn {
  wins: Win[]
  loading: boolean
  error: string | null
  yesterdayWins: Pick<Win, 'title' | 'id' | 'category'>[]
  addWin: (title: string, category?: string) => Promise<Win | undefined>
  editWin: (id: string, newTitle: string) => Promise<void>
  deleteWin: (id: string) => Promise<void>
  rollForward: () => Promise<void>
  toggleWinCompleted: (id: string) => Promise<void>
}

export function useWins(): UseWinsReturn {
  // ... implementation
}
```

## Migration Order

The migration should follow a dependency-aware order (leaves first, inward):

**Wave 1 -- Leaf utilities (no imports from other src files):**
- `src/lib/utils/date.js` -> `.ts`
- `src/lib/env.js` -> `.ts`
- `src/lib/notifications.js` -> `.ts`
- `src/lib/push-subscription.js` -> `.ts`

**Wave 2 -- Supabase client + stores (depend on lib/):**
- `src/lib/supabase.js` -> `.ts` (add `Database` generic)
- `src/stores/uiStore.js` -> `.ts`
- `src/stores/settingsStore.js` -> `.ts`

**Wave 3 -- Hooks (depend on lib/ + stores/):**
- All `src/hooks/*.js` -> `.ts`

**Wave 4 -- Leaf components (no child component imports):**
- `src/components/theme/ThemeToggle.jsx` -> `.tsx`
- `src/components/NotificationPermission.jsx` -> `.tsx`
- `src/components/dev/DevToolsPanel.jsx` -> `.tsx`
- All `src/components/wins/*.jsx` -> `.tsx`
- All `src/components/journal/*.jsx` -> `.tsx`
- All `src/components/history/*.jsx` -> `.tsx`

**Wave 5 -- Layout + pages + entry (depend on everything):**
- `src/components/layout/*.jsx` -> `.tsx`
- `src/pages/*.jsx` -> `.tsx`
- `src/App.jsx` -> `.tsx`
- `src/main.jsx` -> `.tsx` (update index.html)

**Wave 6 -- Config + test files:**
- `vite.config.js` -> `.ts`
- `vitest.config.js` -> `.ts`
- `src/test-setup.js` -> `.ts`
- All `*.test.jsx` / `*.test.js` -> `.test.tsx` / `.test.ts`

**Wave 7 -- Strict mode:**
- Flip `strict: false` to `strict: true` in tsconfig.app.json
- Fix any remaining errors (likely null checks)
- Verify `tsc --noEmit` passes clean

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tsconfig.json` monolith | Project references (`tsconfig.app.json` + `tsconfig.node.json`) | Vite 5+ scaffolds | Separate browser vs node compilation targets |
| `"moduleResolution": "node"` | `"moduleResolution": "bundler"` | TypeScript 5.0 (2023) | Correct resolution for Vite/esbuild bundled projects |
| `@vitejs/plugin-react-swc` for TS | Vite 7.x esbuild (built-in) | Current | No extra plugin needed for .tsx transpilation |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | `vitest.config.js` (rename to `.ts` in this phase) |
| Quick run command | `bun run vitest run --reporter=verbose` |
| Full suite command | `bun run vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DW-01 | Develop branch exists | manual | `git branch --list develop` | N/A -- git operation |
| DW-02 | Dev tools absent from main build | smoke | `bun run build && grep -r "DevToolsPanel" dist/ \|\| echo "PASS"` | Wave 0 |
| DW-03 | Dev server accessible on network | manual | `bun run dev` and check --host in output | N/A -- manual verification |
| TS-01 | No .jsx/.js source files remain | smoke | `find src -name '*.jsx' -o -name '*.js' \| wc -l` should be 0 (except sw.js if kept) | Wave 0 |
| TS-02 | Supabase types exist and are imported | unit | `tsc --noEmit` passes | Wave 0 |
| TS-03 | New code in TypeScript | lint | ESLint config covers .ts/.tsx | N/A -- enforced by config |
| TS-04 | Strict mode enabled and passing | smoke | `tsc --noEmit` with `strict: true` | Wave 0 |

### Sampling Rate
- **Per task commit:** `bun run vitest run --reporter=verbose`
- **Per wave merge:** `bun run vitest run && tsc --noEmit`
- **Phase gate:** Full suite green + `tsc --noEmit` passes with strict mode

### Wave 0 Gaps
- [ ] `tsconfig.app.json` -- full TypeScript config for app code (currently only minimal `tsconfig.json`)
- [ ] `tsconfig.node.json` -- TypeScript config for Vite/Vitest config files
- [ ] `src/vite-env.d.ts` -- Vite client type declarations + ImportMetaEnv
- [ ] `src/lib/database.types.ts` -- Supabase generated types
- [ ] ESLint config update to include `.ts/.tsx` file patterns

## Open Questions

1. **Service worker TypeScript migration**
   - What we know: `sw.js` uses Workbox APIs and `self.__WB_MANIFEST`. vite-plugin-pwa processes it separately.
   - What's unclear: Whether vite-plugin-pwa 1.2.0 supports `.ts` service worker files with `injectManifest` strategy.
   - Recommendation: Keep `sw.js` as-is for this phase. It's isolated from the app code and can be migrated later if needed.

2. **Vercel branch-based environment variables**
   - What we know: Vercel supports per-branch env var scoping in project settings.
   - What's unclear: Whether develop branch will have its own Vercel preview deployment configuration.
   - Recommendation: Use `VITE_ENABLE_DEV_TOOLS` env var. Set to `true` for develop branch previews, unset for main production. Local dev always shows dev tools via `import.meta.env.DEV` fallback.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis -- 40 source files, 25 test files, 5,573 total LOC
- `package.json` -- `@types/react` ^19.2.7, `@types/react-dom` ^19.2.3 already installed
- `tsconfig.json` -- minimal, only path aliases currently
- Supabase CLI v2.75.0 installed, project linked to `zwolbvnwybtjtgqrwolw`
- Vite 7.3.1 -- native .tsx support via esbuild, no plugins needed
- STACK.md research from milestone planning (2026-03-16)

### Secondary (MEDIUM confidence)
- TypeScript project references pattern from Vite scaffold conventions
- `supabase gen types typescript --linked` command verified via `--help` output

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - TypeScript is the only new dev dependency; everything else exists
- Architecture: HIGH - patterns are well-established Vite + TypeScript conventions
- Pitfalls: HIGH - identified from direct codebase analysis (index.html entry, ESLint config, vitest config)

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable technologies, 30-day validity)
