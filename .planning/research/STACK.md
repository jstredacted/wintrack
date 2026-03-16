# Technology Stack — v2.0 Additions

**Project:** wintrack v2.0 Finance & Platform
**Researched:** 2026-03-16
**Scope:** NEW dependencies only. Existing stack (Vite, React 19, Tailwind v4, shadcn/ui, Supabase, Zustand, motion, Lucide) is validated and unchanged.

---

## Recommended Stack Additions

### 1. Rich Text Editor — Tiptap

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@tiptap/react` | ^3.20 | React bindings for headless editor | Fully headless = complete style control. Matches Nothing aesthetic perfectly because you build the toolbar and editor chrome yourself. TypeScript-native. MIT license. 1,750+ dependents on npm. |
| `@tiptap/pm` | ^3.20 | ProseMirror peer dependency | Required by @tiptap/react for document model |
| `@tiptap/starter-kit` | ^3.20 | Common extensions bundle | Includes Bold, Italic, BulletList, OrderedList, Heading, Strike, Code, Blockquote, HardBreak, ListItem, Document, Paragraph, Text, Undo/Redo. Covers all v2.0 formatting requirements in one install. |

**Why Tiptap over alternatives:**
- **vs Slate.js** — Slate requires building every extension from scratch (bold, lists, etc.). Tiptap's StarterKit gives bold/italic/bullets out of the box. Slate's learning curve is steeper for the same output.
- **vs Lexical (Meta)** — Lexical's "playground" approach means assembling many pieces. Its ecosystem is smaller and docs are less mature. Overkill for a journal editor.
- **vs Quill** — Quill v2 has a rigid, opinionated UI that fights against custom monochrome styling. Less composable architecture.

**Storage format decision:** Store as **Tiptap JSON** (`editor.getJSON()`) in Supabase `journal_entries.body` column. Currently stores plain text strings — migrate the column to JSONB. JSON preserves document structure, enables querying, and round-trips perfectly through Tiptap.

**Backward compatibility:** Existing plain-text entries render by wrapping in a paragraph node on read:
```javascript
// Migration helper for existing plain-text body strings
const content = typeof entry.body === 'string'
  ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: entry.body }] }] }
  : entry.body;
```

**Integration point:** Replace `<textarea>` in `src/components/journal/JournalEditorOverlay.jsx` with `<EditorContent editor={editor} />`. The `useEditor` hook replaces `useState` for body. Word count via `editor.getText().trim().split(/\s+/).length`.

**What you do NOT need separately:**
- `@tiptap/extension-bullet-list`, `@tiptap/extension-bold`, etc. — all included in StarterKit
- `@tiptap/extension-placeholder` — nice-to-have, defer unless explicitly wanted
- Any Tiptap Pro (paid) extensions — collaboration, AI features are out of scope

**Confidence:** HIGH — verified via [Tiptap npm](https://www.npmjs.com/package/@tiptap/react) (v3.20.1 published 9 days ago) and [official install docs](https://tiptap.dev/docs/editor/getting-started/install/react)

---

### 2. Finance Charts — Recharts via shadcn/ui Chart Component

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `recharts` | ^3.8 | SVG chart rendering for finance dashboard | shadcn/ui's official Chart component is built on Recharts. Using the shadcn chart primitives means automatic dark mode support, Nova preset theming, and monochrome styling with zero extra config. |

**Critical insight:** Do NOT install Recharts directly. Use **`bunx shadcn@latest add chart`** which scaffolds `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, and `ChartLegend` components into your codebase and adds `recharts` as a dependency. This gives you themed chart wrappers that inherit the existing design system.

**Chart types needed for finance port:**
| Chart Type | Finance Use Case |
|------------|-----------------|
| `PieChart` | Budget category breakdown (needs, wants, savings) |
| `BarChart` | Monthly income vs. expenses comparison |
| `LineChart` | Investment portfolio value over time |
| `AreaChart` | Cumulative spending trends |

**Why Recharts over alternatives:**
- **vs Nivo** — Heavier bundle, requires Canvas for some charts, doesn't integrate with shadcn theming
- **vs Victory** — Cross-platform focus (React Native) adds weight this project doesn't need
- **vs Chart.js** — Canvas-based (not SVG), harder to style with Tailwind, no shadcn integration
- **vs raw D3** — Recharts wraps D3; building from scratch is unnecessary for standard chart types

**Confidence:** HIGH — [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart) confirm Recharts as the chart engine

---

### 3. TypeScript — Incremental Migration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `typescript` | ^5.8 | Type checking and IDE intelligence | Already have `@types/react` (^19.2.7) and `@types/react-dom` (^19.2.3) installed. Vite handles .tsx transpilation via esbuild natively — zero plugin changes. |

**No new runtime dependencies.** TypeScript is dev-only. Vite already transpiles .ts/.tsx through esbuild without configuration changes.

**Configuration files to create:**

`tsconfig.json` (project references root):
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json` (incremental migration mode):
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
    "isolatedModules": true
  },
  "include": ["vite.config.ts"]
}
```

**Migration strategy:**
1. Add tsconfig files with `allowJs: true`, `strict: false`
2. Rename `main.jsx` to `main.tsx`, update `index.html` script src
3. Rename `vite.config.js` to `vite.config.ts`
4. Migrate leaf components first (no child imports), working inward
5. .jsx and .tsx coexist during migration — no big-bang rename
6. After all files migrated, flip to `strict: true`

**What you do NOT need:**
- `vite-tsconfig-paths` — existing `resolve.alias` in vite.config already handles `@/`; matching `paths` in tsconfig gives IDE support
- `ts-migrate` or codemods — at ~3,274 LOC, manual migration produces cleaner types than automated `any` injection
- `@typescript-eslint/parser` — add when ESLint config is updated, not blocking for migration

**Confidence:** HIGH — [Vite TypeScript docs](https://vite.dev/guide/features) confirm native .tsx support via esbuild

---

### 4. PIN Authentication Gate — Zero New Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Web Crypto API | (browser native) | SHA-256 hashing for PIN | Zero dependency. `crypto.subtle.digest('SHA-256', ...)` is available in all modern browsers. |
| Zustand (existing) | ^5.0.11 | Session unlock state | `isUnlocked: boolean` in a store. Already in project. |
| Supabase (existing) | ^2.98.0 | PIN hash storage | Store hashed PIN in `user_settings` table (or new `pin_hash` column). |

**Implementation approach:**
- PIN entry screen renders as a gate before `<App />` in the component tree
- Hash PIN with `crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))` — convert to hex string for storage
- Compare entered PIN hash against stored hash in Supabase
- Store unlock state in Zustand; optionally persist to `sessionStorage` (survives refresh, clears on tab close)
- PIN setup flow: first-time user sets PIN, hash stored to Supabase

**What you do NOT need:**
- Supabase Auth — overkill for single-user PIN gate
- `bcrypt` / `argon2` / `scrypt` WASM — these are for multi-user password storage with brute-force resistance. A personal PIN on a personal app with no network exposure does not need them.
- JWT tokens — the existing anon key approach stays; PIN is a UI-only gate

**Confidence:** HIGH — Web Crypto API has universal browser support, no dependencies

---

### 5. Mobile Responsiveness — Zero New Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind v4 (existing) | ^4.2.1 | Responsive breakpoints | `sm:`, `md:`, `lg:` utilities already available. Flex and grid layouts handle reflow. |

**What this involves (implementation, not stack):**
- Audit fixed desktop widths: `px-32` in JournalEditorOverlay, `max-w-[1100px]` in AppShell
- Replace with responsive variants: `px-4 sm:px-12 lg:px-32`
- Touch targets: minimum 44x44px for all interactive elements
- SideNav likely becomes a bottom tab bar on mobile (responsive layout change)
- DayStrip horizontal scroll needs touch gesture refinement
- Test with `bun run dev --host` for real device testing

**What you do NOT need:**
- `react-responsive` or media query hooks — Tailwind handles responsive at CSS level
- Container query polyfill — native support covers target browsers
- Mobile component library — existing shadcn components are responsive-ready

**Confidence:** HIGH — no new technology needed

---

## Complete Installation

```bash
# Rich text editor (3 packages)
bun add @tiptap/react @tiptap/pm @tiptap/starter-kit

# Charts (scaffolds components + adds recharts dependency)
bunx shadcn@latest add chart

# TypeScript (dev only)
bun add -D typescript
```

**Total new dependency surface:**
- **3 runtime packages** — Tiptap trio (@tiptap/react, @tiptap/pm, @tiptap/starter-kit)
- **1 runtime package** — Recharts (added automatically by shadcn chart scaffold)
- **1 dev package** — TypeScript
- **0 packages** — PIN auth (Web Crypto API) and mobile responsiveness (Tailwind)

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Slate.js | Must build every extension manually; steeper learning curve for same output | Tiptap + StarterKit |
| Quill | Opinionated UI fights monochrome styling; less composable | Tiptap (headless) |
| Nivo / Victory / Chart.js | No shadcn integration; heavier; wrong rendering model | Recharts via shadcn chart |
| D3 directly | Recharts wraps D3; raw D3 is unnecessary for standard charts | Recharts |
| bcrypt / argon2 WASM | Overkill for personal single-user PIN; adds WASM dependency | Web Crypto SHA-256 |
| Supabase Auth | No multi-user auth needed; adds auth session complexity | Simple PIN hash comparison |
| `ts-migrate` codemods | Produces noisy `any` types at this codebase size | Manual file-by-file migration |
| `vite-tsconfig-paths` | Existing vite resolve.alias already handles `@/` path | tsconfig `paths` for IDE only |
| `react-responsive` | Tailwind responsive utilities handle all breakpoint needs | `sm:` / `md:` / `lg:` variants |
| `date-fns` for finance | Existing `Intl.DateTimeFormat` pattern works; avoid adding a date library for formatting alone | `Intl.DateTimeFormat` + native Date methods |

---

## Database Schema Additions (Supabase)

These are not npm packages but are stack-relevant for the finance port:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `month_settings` | Monthly salary, budget allocation | `month` (YYYY-MM), `salary`, `needs_pct`, `wants_pct`, `savings_pct` |
| `transactions` | Income and expense records | `amount`, `category`, `description`, `date`, `type` (income/expense) |
| `bills` | Recurring bills tracking | `name`, `amount`, `due_day`, `is_paid`, `month` |
| `investments` | Investment portfolio entries | `name`, `type`, `amount`, `current_value`, `date_added` |

The `journal_entries.body` column needs migration from `text` to `jsonb` to store Tiptap JSON.

---

## Version Compatibility Matrix

| New Package | Compatible With | Verified |
|-------------|-----------------|----------|
| @tiptap/react ^3.20 | React ^19.x | Yes — Tiptap v3 supports React 18+ |
| recharts ^3.8 | React ^19.x | Yes — Recharts v3 supports React 18+ |
| typescript ^5.8 | Vite ^7.x | Yes — Vite uses esbuild for TS, no tsc integration needed |
| typescript ^5.8 | @types/react ^19.2 | Yes — types packages already installed |

---

## Sources

- [Tiptap React Install Docs](https://tiptap.dev/docs/editor/getting-started/install/react)
- [Tiptap StarterKit Extensions](https://tiptap.dev/docs/editor/extensions/functionality/starterkit)
- [Tiptap JSON/HTML Output Guide](https://tiptap.dev/docs/guides/output-json-html)
- [Tiptap Persistence Docs](https://tiptap.dev/docs/editor/core-concepts/persistence)
- [@tiptap/react on npm](https://www.npmjs.com/package/@tiptap/react) — v3.20.1
- [@tiptap/starter-kit on npm](https://www.npmjs.com/package/@tiptap/starter-kit) — v3.20.0
- [shadcn/ui Chart Component](https://ui.shadcn.com/docs/components/radix/chart)
- [Recharts on npm](https://www.npmjs.com/package/recharts) — v3.8.0
- [Vite TypeScript Features](https://vite.dev/guide/features)
- [Vite TS Migration Discussion](https://github.com/vitejs/vite/discussions/6799)

---
*Stack additions research for: wintrack v2.0 Finance & Platform*
*Researched: 2026-03-16*
