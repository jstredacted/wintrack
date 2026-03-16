# Pitfalls Research

**Domain:** Adding finance management, PIN auth, TypeScript, rich text editor, and mobile responsiveness to existing React SPA
**Researched:** 2026-03-16
**Confidence:** HIGH (based on codebase analysis + verified ecosystem documentation)

## Critical Pitfalls

### Pitfall 1: Journal Rich Text Migration Destroys Existing Plain-Text Content

**What goes wrong:**
Tiptap stores content as ProseMirror JSON internally. The existing `journal_entries.body` column contains plain text strings. If you swap the editor to Tiptap without a migration strategy, existing entries render as raw text nodes without paragraph breaks, or worse, fail to parse and display as empty.

**Why it happens:**
Tiptap's `content` prop expects either HTML or ProseMirror JSON. Plain text with `\n` newlines is neither -- ProseMirror will wrap it in a single paragraph, collapsing all line breaks. Developers test with new entries and never open an old one.

**How to avoid:**
1. Add a `body_format` column to `journal_entries` (`'plaintext' | 'tiptap_json'`), defaulting to `'plaintext'` for existing rows.
2. When rendering, check format: plain-text entries get wrapped in `<p>` tags (splitting on `\n\n` for paragraphs, `\n` for `<br>`). Only Tiptap JSON entries load natively.
3. On first edit of a plain-text entry, convert to Tiptap JSON on save. This is a lazy migration -- no bulk data transform needed.
4. Store Tiptap output as JSON (not HTML) in the database for future-proofing.

**Warning signs:**
Old journal entries appear as a single blob of text without line breaks in the new editor.

**Phase to address:**
Journal Rich Text phase -- must be the first concern before building the editor UI.

---

### Pitfall 2: PIN Auth Provides False Security While Leaving Supabase Wide Open

**What goes wrong:**
A client-side PIN gate (React state that blocks rendering until PIN is entered) gives the illusion of security but does nothing server-side. The static JWT and anon key are baked into the Vite bundle (`VITE_USER_JWT`, `VITE_USER_ID`). Anyone who views source or intercepts network traffic can bypass the PIN entirely and hit Supabase directly -- now with finance data exposed.

**Why it happens:**
With v1.0's accountability tracking, the data wasn't sensitive enough to worry about. Finance data (salary, budgets, investments) changes the threat model completely. Developers add a PIN screen and feel secure without addressing the actual attack surface.

**How to avoid:**
1. Be explicit about the threat model: PIN protects against **casual physical access** (someone picks up your phone/laptop), not against determined attackers.
2. Store a hashed PIN in `user_settings` (or localStorage for offline-first). Validate client-side only.
3. Do NOT store financial secrets (actual bank credentials, full account numbers) in Supabase -- this is a tracking app, not a bank integration.
4. Add a session timeout: after 5 minutes of inactivity, re-require PIN. Use a Zustand store with a `lastActivityAt` timestamp.
5. Use `crypto.subtle.digest('SHA-256', ...)` for PIN hashing rather than storing plaintext.

**Warning signs:**
PIN stored as plaintext in localStorage. No session timeout. Finance data treated as if PIN makes it "secure."

**Phase to address:**
PIN Auth phase -- must be designed before finance data enters the system. Finance phase should not ship without PIN gate.

---

### Pitfall 3: TypeScript Migration Breaks Existing Tests and Creates a Two-Language Purgatory

**What goes wrong:**
Renaming `.jsx` to `.tsx` files triggers type errors across the entire import chain. Tests written in plain JS suddenly need type stubs or `@ts-ignore` everywhere. The migration stalls halfway, leaving a codebase that's harder to work with than either pure JS or pure TS -- files randomly fail depending on whether their imports are typed yet.

**Why it happens:**
TypeScript's type checker follows imports transitively. Converting `useWins.js` to `useWins.ts` means every component that imports it now sees type errors for the props they pass. Developers convert one file and discover they need to convert ten.

**How to avoid:**
1. **Configure first, convert later.** Add `tsconfig.json` with `allowJs: true`, `checkJs: false`, `strict: false`. Vite already handles `.ts`/`.tsx` natively -- no bundler changes needed.
2. **Convert leaf-to-root:** Start with `lib/utils/date.js` and `lib/env.js` (no imports from other project files), then `hooks/`, then `stores/`, then `components/`, then `pages/`, then `App.tsx`.
3. **Convert tests alongside source.** When `useWins.js` becomes `useWins.ts`, convert `useWins.test.js` to `useWins.test.ts` in the same commit. Never leave them out of sync.
4. **Create a shared types file early** (`src/types/index.ts`) with `Win`, `JournalEntry`, `Settings`, `Transaction`, `Budget` types. Import these everywhere.
5. **Do NOT enable `strict: true` until all files are converted.** Flip it as the final commit of the TS migration phase.

**Warning signs:**
More than 30% of files are `.ts`/`.tsx` while 70% remain `.js`/`.jsx` for more than one phase. Tests failing with type errors rather than logic errors.

**Phase to address:**
TypeScript Migration phase -- should be a dedicated phase, not sprinkled across feature work.

---

### Pitfall 4: Finance Stored Procedures Fail Silently Under Anon-Key RLS

**What goes wrong:**
The source finance app (350) uses `service-role-key` or Next.js Server Actions that bypass RLS. When porting stored procedures (e.g., `calculate_monthly_totals`, `rollover_budget`) to wintrack's anon-key setup, the procedures either return empty results (RLS filters out all rows) or fail with permission errors. The app shows $0 balances with no error message.

**Why it happens:**
Supabase stored procedures in the `public` schema are called via the PostgREST API with the caller's JWT context. If the function does `SELECT * FROM transactions`, RLS policies filter based on `auth.uid()`. But if the function was written assuming full access, it won't include `user_id` filtering -- and the RLS silently returns zero rows instead of an error.

**How to avoid:**
1. **Every new table must have RLS enabled and policies created before any data is inserted.** Copy the pattern from `001_initial_schema.sql` exactly: `FOR SELECT/INSERT/UPDATE/DELETE TO authenticated USING (auth.uid() = user_id)`.
2. **Test stored procedures with the anon key, not the service role key.** Use `supabase.rpc('function_name', {...})` through the client, never the dashboard SQL editor (which uses service role).
3. **Mark functions as `SECURITY INVOKER`** (the default) -- never `SECURITY DEFINER` unless you specifically need elevated access.
4. **For aggregate functions** (monthly totals, budget summaries): include `WHERE user_id = auth.uid()` explicitly inside the function body even though RLS exists. Belt and suspenders.

**Warning signs:**
Finance dashboard shows $0 or empty state despite having data in the database. Works in Supabase Dashboard SQL editor but not in the app.

**Phase to address:**
Finance phase -- every migration must include RLS policies and be tested through the client SDK, not the dashboard.

---

### Pitfall 5: Mobile Layout Breaks Fixed SideNav and Full-Screen Overlays

**What goes wrong:**
The current `SideNav` is a `fixed left-0 top-0 bottom-0 w-14` sidebar with `main` having `ml-14`. On mobile viewports (< 640px), this 56px sidebar wastes critical horizontal space and makes content feel cramped. Full-screen overlays (`JournalEditorOverlay`, `WinInputOverlay`, `StreakCelebration`) use `createPortal` to `document.body` with `fixed inset-0` -- these work but their internal padding (`px-12`, `sm:px-20`, `lg:px-32`) may not suit small screens. The `max-w-[1100px] mx-auto` wrapper creates dead space on tablets.

**Why it happens:**
The app was built desktop-first with a fixed sidebar assumption baked into the layout hierarchy. Mobile responsiveness isn't just "add some breakpoints" -- it requires restructuring the navigation pattern entirely (sidebar becomes bottom tab bar on mobile).

**How to avoid:**
1. **SideNav becomes a bottom tab bar on mobile.** At `< md` (768px), switch from left sidebar to fixed bottom nav. This is a component restructure, not just CSS.
2. **Remove `ml-14` from `<main>` on mobile.** Use `md:ml-14 ml-0` with conditional rendering of the sidebar.
3. **Audit every `px-*` value in overlays.** The `JournalEditorOverlay` uses `px-12 sm:px-20 lg:px-32` -- on mobile, even `px-12` (48px each side = 96px total) is too much on a 375px screen. Use `px-4 sm:px-12 lg:px-32`.
4. **Test with `vite --host` on actual phones**, not just Chrome DevTools responsive mode. Touch targets, viewport height (`h-svh` is correct), and virtual keyboard interaction are different.
5. **The DayStrip carousel is swipe-critical on mobile** -- ensure touch events work, not just click/drag.

**Warning signs:**
Content is cut off or requires horizontal scrolling on mobile. Sidebar covers content. Overlays have huge margins on small screens.

**Phase to address:**
Mobile Responsiveness phase -- should come after all new UI features (finance, rich text) are built, so responsive work covers everything at once.

---

### Pitfall 6: Tiptap Performance Kills the Nothing Design Minimalism

**What goes wrong:**
Tiptap's default setup loads ProseMirror's full editing infrastructure. With React node views, every keystroke can trigger re-renders across the component tree. The journal editor -- currently a lightweight `<textarea>` -- becomes a 200ms-to-first-input sluggish experience that contradicts the app's snappy, minimal character.

**Why it happens:**
Tiptap re-renders the React component wrapping `useEditor` on every transaction by default. If the editor is inside an `AnimatePresence` or the overlay uses `motion` components, the render cost compounds. Developers add extensions (bold, italic, lists, headings) without realizing each adds processing overhead.

**How to avoid:**
1. **Use `shouldRerenderOnTransaction: false`** on the `useEditor` hook. Only re-render when you explicitly need updated state.
2. **Use `useEditorState` with a selector** for toolbar state (is bold active? is list active?) instead of reading from the editor instance on every render.
3. **Limit extensions to exactly what's needed:** `StarterKit` minus `CodeBlock` and `HorizontalRule`, plus `Placeholder`. Do NOT add `Table`, `Image`, `TaskList` unless explicitly required.
4. **Keep the overlay portal pattern.** The current `JournalEditorOverlay` uses `createPortal` -- this isolates the editor from the main React tree, which is actually good for performance.
5. **Lazy-load Tiptap.** Use `React.lazy(() => import('./TiptapEditor'))` so the ~100-150KB of ProseMirror JS doesn't load until the user opens the editor.

**Warning signs:**
Typing lag visible on keystroke. Bundle size increases by more than 150KB gzipped. First render of editor takes > 100ms.

**Phase to address:**
Journal Rich Text phase -- performance constraints should be in the acceptance criteria.

---

### Pitfall 7: Dev Branch Workflow Leaks Dev Tools Into Production

**What goes wrong:**
The current `DevToolsPanel` is gated by `import.meta.env.DEV`, which works for local dev vs. Vercel production. But the v2.0 plan calls for a `develop` branch workflow where dev tools should exist on `develop` but not `main`. If this is implemented as a runtime environment variable, the dev tools code (including test data seeding capabilities) ships in the production bundle -- it's just hidden, not removed. Anyone inspecting the bundle can find and invoke the seeding functions.

**Why it happens:**
`import.meta.env.DEV` is a Vite compile-time constant that's `true` during `vite dev` and `false` during `vite build`. There's no built-in concept of "this is the develop branch build vs. main branch build" in Vite -- both use `vite build`.

**How to avoid:**
1. **Keep using `import.meta.env.DEV` as the primary gate.** It already tree-shakes the entire `DevToolsPanel` from production builds.
2. **If you need dev tools in a deployed `develop` preview:** Use a Vercel-specific env var like `VITE_ENABLE_DEV_TOOLS=true` set only on the `develop` branch's preview deployments. Gate with `import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true'`.
3. **Ensure Vite's dead-code elimination works.** The `if (import.meta.env.DEV)` pattern causes the bundler to strip the block in production. Adding a runtime `VITE_ENABLE_DEV_TOOLS` check still includes the code in the bundle -- use dynamic `import()` to lazy-load dev tools only when the env var is set.
4. **Keep all seeding logic in `src/components/dev/`** so tree-shaking boundaries are clean.

**Warning signs:**
`DevToolsPanel` or seeding functions visible in production bundle analysis. Test data appears in production database.

**Phase to address:**
Dev Branch Workflow phase -- should be addressed early as it affects deployment pipeline for all subsequent features.

---

### Pitfall 8: Finance Currency/Locale Handling Hardcoded Across Components

**What goes wrong:**
The source app (350) likely uses Philippine Peso with hardcoded formatting. Copying `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })` throughout finance components makes the code brittle and violates DRY. Floating-point arithmetic on amounts (e.g., `100.10 + 200.20 !== 300.30`) causes penny rounding errors that compound over months.

**Why it happens:**
Finance porting from a specific-currency app. Developers copy formatting calls inline and use JavaScript `number` type for amounts without considering decimal precision.

**How to avoid:**
1. **Create a single `formatCurrency(amount)` utility** in `lib/utils/currency.ts` that reads the currency setting from the settings store. Every component calls this, never `Intl.NumberFormat` directly.
2. **Store amounts as integers (centavos/cents)** in the database to avoid floating-point precision issues. `12345` = PHP 123.45. Display conversion happens only at the UI layer.
3. **Add `currency` and `locale` to the settings store** alongside `dayStartHour`. Default to PHP/en-PH but make it changeable.

**Warning signs:**
Currency symbol or decimal formatting hardcoded in more than one file. Amounts stored as floats in the database. Totals don't add up after many transactions.

**Phase to address:**
Finance phase -- currency utility and integer storage convention must be established before any finance UI components.

---

### Pitfall 9: Tiptap + motion/react CSS Translate Collision

**What goes wrong:**
This is a known issue in the existing codebase. The `JournalEditorOverlay` uses both `motion` components (for AnimatePresence transitions) and will now contain Tiptap (which uses ProseMirror's DOM manipulation). ProseMirror positions cursor and selection overlays using absolute positioning. If a parent `motion.div` applies CSS `translate` during animation, ProseMirror's overlay positions are offset by the transform -- cursor appears in the wrong place, selection highlights are shifted.

**Why it happens:**
motion v12 uses the CSS `translate` individual property (not `transform: translate3d()`). ProseMirror's position calculations don't account for parent transforms. This is the same class of bug that already caused the tw-animate-css conflict documented in the project's key decisions.

**How to avoid:**
1. **Never animate the Tiptap editor's direct parent with transforms.** The overlay wrapper can animate (fade in/out via opacity), but the `motion.div` containing the `<EditorContent>` component must not have `y`, `x`, or `scale` animation properties.
2. **Use the existing pattern:** The `JournalEditorOverlay` already uses CSS keyframe animations (`journal-overlay-enter`/`journal-overlay-exit`) on the outermost div, with `motion` only on child content wrappers. Keep Tiptap in a static (non-animated) container.
3. **Test cursor position after overlay enter animation completes.** Click in the middle of existing text -- cursor must appear exactly where clicked, not offset.

**Warning signs:**
Cursor appears above or below where the user clicks in the editor. Selection highlight is shifted relative to actual text.

**Phase to address:**
Journal Rich Text phase -- must be tested during implementation, not discovered later.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `any` types during TS migration | Unblocks conversion of complex files | Loses all type safety benefit, creates false confidence | During migration only -- must be resolved before `strict: true` |
| Storing Tiptap HTML instead of JSON | Simpler database reads for display | Cannot re-edit content reliably, harder to migrate editor later | Never -- always store JSON, render HTML on demand |
| Skipping PIN hash (storing plaintext) | Faster implementation | Trivially readable in DevTools Application tab | Never -- `crypto.subtle` is free and built-in |
| Inline currency formatting | Quick per-component | Every component must change if currency/locale changes | Only in a single prototype component, extract immediately |
| Using `@ts-ignore` in tests | Tests pass without type effort | Masks real bugs, tests don't verify type contracts | During TS migration transition only, max 1 phase |
| Skipping `body_format` column | Avoids migration complexity | All old journal entries lose line breaks silently | Never -- the column is one ALTER TABLE away |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Tiptap + motion/react | Wrapping `<EditorContent>` in `motion.div` with translate animations | Keep editor in a static container; animate only the overlay wrapper via opacity or CSS keyframes |
| Tiptap + Tailwind v4 | Using `@tailwindcss/typography` prose classes that fight ProseMirror's inline styles | Use Tiptap's own CSS or a scoped `.tiptap` class with targeted styles; avoid prose |
| Tiptap + existing overlay pattern | Replacing the current `<textarea>` wholesale, breaking the word count and save flow | Keep the overlay state machine (visible/exiting/screen), swap only the textarea for `<EditorContent>`, extract content via `editor.getJSON()` instead of `body` state |
| Supabase RPC + anon key | Calling `supabase.rpc()` and assuming it bypasses RLS like service-role | RPC functions execute with caller's JWT context; include `WHERE user_id = auth.uid()` in function body |
| Supabase new tables + existing JWT | Creating finance tables without RLS, relying on "single user so it's fine" | Always enable RLS, always add policies -- the JWT pattern from `001_initial_schema.sql` already works |
| Vite env vars + branch deploys | Using `process.env` syntax (Node.js) instead of `import.meta.env` (Vite) | All client env vars must be `VITE_` prefixed and accessed via `import.meta.env` |
| TypeScript + Vitest | Vitest runs through Vite which skips type checking -- types can be wrong but tests still pass | Add `tsc --noEmit` as a separate CI/pre-commit step; Vitest validates behavior, `tsc` validates types |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Tiptap re-renders on every transaction | Typing lag, high CPU during text input | `shouldRerenderOnTransaction: false` + `useEditorState` selectors | Noticeable at ~500 words in a single entry |
| Loading full Tiptap on app init | Initial bundle +100-150KB, slower first paint | `React.lazy` + dynamic import, load only when editor opens | Immediate on slow mobile connections |
| Finance aggregation queries without indexes | Monthly summary pages take seconds to load | Add indexes on `(user_id, transaction_date)` and `(user_id, budget_month)` | After ~6 months of daily transaction data |
| Unoptimized DayStrip + finance data | Fetching wins + journal + transactions for every day in the carousel | Fetch only for visible day; prefetch adjacent days lazily | When finance data is added to the daily view |
| TypeScript `tsc` on every save in dev | Dev server becomes sluggish, feedback loop slows | Only run `tsc --noEmit` in CI/pre-commit, not on HMR; Vite skips types by design | Immediate if misconfigured |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| PIN stored as plaintext in localStorage | Anyone with physical device access reads it from DevTools > Application > Local Storage | Hash with `crypto.subtle.digest('SHA-256', ...)` before storing |
| Finance amounts exposed without PIN timeout | User walks away, someone else sees salary/budget data | Implement idle timeout (5 min default) that re-requires PIN entry |
| Static JWT in Vite bundle with finance data | JWT extracted from bundle gives full Supabase CRUD access | Accept as known limitation; do not store actual bank credentials or sensitive account numbers |
| New finance tables without RLS | Entire table readable/writable by anyone with the anon key URL | Enable RLS + policies in every migration file, before any data inserts |
| Service-role key ported from 350 into client code | Complete database admin access from the browser console | Never reference service-role key in client code; all queries go through anon key + RLS |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Rich text toolbar breaks Nothing aesthetic | Colorful formatting buttons destroy monochrome design language | Keyboard shortcuts only (Cmd+B, Cmd+I) with minimal ghost toolbar on text selection, or slash-command menu |
| Mobile bottom nav covers FAB button | Journal FAB at bottom-right collides with bottom tab bar | Hide FAB when on journal page; on other pages, position FAB above bottom nav with appropriate spacing |
| Finance dashboard disconnected from daily view | User must navigate to separate section, breaking daily accountability flow | Add a finance summary widget to the daily view (today's spending, budget remaining) |
| PIN entry feels hostile on every app open | Opening app to quickly log a win requires PIN first | Offer "remember for 24 hours on this device" option using a localStorage timestamp |
| Tiptap editor feels alien in monochrome app | Default Tiptap styling (blue links, colored highlights) clashes with black/white aesthetic | Override all Tiptap default styles with monochrome equivalents in a scoped `.tiptap` CSS class |

## "Looks Done But Isn't" Checklist

- [ ] **Rich Text Editor:** Old plain-text entries render correctly -- open a pre-migration entry with line breaks, verify paragraphs are preserved
- [ ] **Rich Text Editor:** Word count still works -- the current overlay tracks word count from `<textarea>` value; Tiptap needs `editor.storage.characterCount` or `editor.getText()` equivalent
- [ ] **TypeScript Migration:** `tsc --noEmit` passes with zero errors -- run it, not just `vite build` (which ignores types)
- [ ] **TypeScript Migration:** All 149 existing tests still pass after conversion -- run full suite, not just the file being converted
- [ ] **PIN Auth:** Session timeout works -- leave app idle 5+ minutes, return, verify PIN is re-required
- [ ] **PIN Auth:** PIN hash survives localStorage clear -- user must be able to re-set PIN, not be locked out
- [ ] **Finance RLS:** All finance queries work through the app client -- test every table and RPC via the anon key, not the dashboard
- [ ] **Finance RLS:** Supabase dashboard SQL editor results differ from app results -- this is expected (dashboard uses service role); verify app results are correct
- [ ] **Mobile Layout:** Bottom tab bar doesn't overlap page content -- scroll to bottom of a long page, verify last item is visible
- [ ] **Mobile Layout:** Virtual keyboard doesn't break overlays -- open JournalEditorOverlay on mobile, focus textarea, verify layout doesn't jump or content isn't hidden
- [ ] **Mobile Layout:** DayStrip is swipeable on touch devices -- test on actual phone, not just Chrome DevTools
- [ ] **Dev Branch:** Production bundle (`vite build && npx vite preview`) contains zero references to DevToolsPanel -- check with bundle analyzer
- [ ] **Finance Currency:** Amounts display correctly for edge cases: 0.01, 999999.99, 0, and negative values
- [ ] **Tiptap + motion:** Cursor position is accurate after overlay animation completes -- click in middle of text, cursor must appear at click point

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Plain-text journal entries corrupted by Tiptap | MEDIUM | Add `body_format` column retroactively, write migration to tag existing entries, re-render with format-aware display |
| TS migration stalled halfway | LOW | Keep `allowJs: true, strict: false`, mixed codebase works fine; convert remaining files at natural touch points |
| Finance tables missing RLS | HIGH | Enable RLS immediately (locks out all access until policies added), then add policies, then verify -- potential brief outage |
| PIN stored as plaintext | LOW | Hash existing value, update storage key to force re-entry, clear old plaintext from localStorage |
| Tiptap performance unacceptable | MEDIUM | Fall back to Markdown editor (textarea + marked.js for preview) -- less capability but matches Nothing aesthetic better |
| SideNav mobile layout broken | MEDIUM | Interim fix: hide sidebar on mobile with `hidden md:flex`, add floating hamburger menu |
| Currency rounding errors in finance totals | HIGH | Requires retroactive conversion of float amounts to integer centavos across all tables and recalculation of aggregates |
| Tiptap cursor offset from motion transforms | LOW | Move Tiptap into a static (non-animated) container; only animate the overlay wrapper |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Journal content migration | Journal Rich Text | Open 3+ old plain-text entries in new editor, verify formatting preserved |
| PIN false security | PIN Auth | Document threat model explicitly in phase plan; verify idle timeout works |
| TS migration purgatory | TypeScript Migration | All files converted in single phase; `tsc --noEmit` passes |
| RLS on finance tables | Finance | Every migration SQL file includes `ENABLE ROW LEVEL SECURITY` and policies |
| SideNav mobile breakage | Mobile Responsiveness | Test on 375px viewport (iPhone SE) and 768px (iPad) with real touch |
| Tiptap performance | Journal Rich Text | Bundle increase < 150KB gzipped; editor loads in < 200ms on mobile |
| Tiptap + motion cursor offset | Journal Rich Text | Click-test cursor accuracy after overlay enter animation |
| Dev tools in prod bundle | Dev Branch Workflow | Bundle analysis shows zero dev-only code in production build |
| Currency handling | Finance | `formatCurrency()` utility exists before any finance UI; amounts stored as integers |
| Float rounding errors | Finance | Database schema uses integer type for amounts (centavos); no float columns |

## Sources

- [Tiptap Performance Guide](https://tiptap.dev/docs/guides/performance) -- `shouldRerenderOnTransaction`, `useEditorState` selectors
- [Tiptap Content Persistence](https://tiptap.dev/docs/editor/core-concepts/persistence) -- JSON vs HTML storage, migration strategies
- [Tiptap Output Formats](https://tiptap.dev/docs/guides/output-json-html) -- JSON recommended over HTML for storage
- [Tiptap Best Practices for Database Storage](https://github.com/ueberdosis/tiptap/discussions/964) -- community patterns for JSON vs HTML
- [TypeScript Official Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html) -- incremental migration with `allowJs`
- [Gradual TypeScript Adoption in React](https://mazenadel19.medium.com/gradual-typescript-adoption-in-react-1bdb2b363722) -- leaf-to-root conversion strategy
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- policy patterns, function security context
- [Supabase API Security](https://supabase.com/docs/guides/api/securing-your-api) -- anon key safety with RLS, role distinctions
- [Supabase RLS Guide: Policies That Actually Work](https://designrevision.com/blog/supabase-row-level-security) -- practical RLS patterns
- [Client-side Authentication Limitations](https://www.taniarascia.com/full-stack-cookies-localstorage-react-express/) -- localStorage security constraints
- [JWT Storage Security in React](https://cybersierra.co/blog/react-jwt-storage-guide/) -- XSS attack surface with client-side tokens
- Codebase analysis: `src/lib/supabase.js` (static JWT via `accessToken`), `src/lib/env.js` (env validation), `supabase/migrations/001_initial_schema.sql` (RLS policy pattern), `src/components/layout/SideNav.jsx` (fixed sidebar at w-14), `src/components/layout/AppShell.jsx` (ml-14 main margin), `src/components/journal/JournalEditorOverlay.jsx` (portal + motion + state machine pattern)

---
*Pitfalls research for: wintrack v2.0 feature additions to existing React SPA*
*Researched: 2026-03-16*
