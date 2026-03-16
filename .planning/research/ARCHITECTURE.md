# Architecture Patterns

**Domain:** Personal accountability app — v2.0 finance integration, PIN auth, TypeScript, rich text
**Researched:** 2026-03-16
**Confidence:** HIGH (extends well-established existing patterns; no architectural novelty)

## Current Architecture (v1.0)

```
App.jsx (createBrowserRouter)
  AppShell (SideNav fixed-left + <Outlet />)
    TodayPage (wins + DayStrip carousel + history detail)
    JournalPage (entries list + FAB + JournalEditorOverlay)
    SettingsPage

Stores: uiStore (UI state), settingsStore (user prefs + localStorage cache)
Hooks: useWins, useJournal, useStreak, useHistory, useSettings, useTheme
Data: supabase.js client (anon key + static JWT via VITE_USER_JWT)
Files: 60+ .jsx/.js files, one .tsx (shadcn button), minimal tsconfig.json
```

Key architectural characteristics:
- **No auth layer** — static UUID + JWT in env vars, RLS on all tables
- **Hook-per-domain pattern** — each data domain (wins, journal, streak) has one hook with useState + useEffect + supabase queries
- **Overlay state machine** — full-screen overlays use visible/exiting states with onAnimationEnd unmount + createPortal
- **No global state for data** — Zustand stores hold only UI state (overlay flags, devtools toggle, streak refresh key)
- **Optimistic updates** — mutations apply locally first, then write to Supabase, rollback on error

## Recommended Architecture for v2.0

### High-Level Structure

```
main.tsx
  App.tsx (createBrowserRouter)
    PinGate (layout route — wraps all children)
      AppShell (SideNav + Outlet)
        TodayPage (unchanged)
        JournalPage (Tiptap replaces textarea)
        FinancePage (new — dashboard with sub-sections)
        SettingsPage (PIN management added)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `PinGate` | Client-side PIN lock screen, session gating | settingsStore (PIN hash), sessionStorage |
| `AppShell` | Layout: responsive SideNav/bottom-bar + Outlet | Router, uiStore |
| `FinancePage` | Finance dashboard — month selector + section tabs | Finance hooks |
| `DashboardOverview` | Summary cards (balance, spent, remaining) | useDashboard RPC |
| `BudgetCard` | Monthly salary + budget display | useBudget |
| `BillsList` | Recurring bills with paid toggle | useBills |
| `InvestmentsList` | Investment contribution tracker | useInvestments |
| `TransactionList` | Filterable transaction log | useTransactions |
| `AddTransactionOverlay` | Full-screen transaction input | useTransactions |
| `MonthSelector` | Month navigation (prev/next) | Lifts month string to FinancePage |
| `JournalEditorOverlay` | Rich text Tiptap editor (replaces textarea) | useJournal |
| `JournalToolbar` | Minimal formatting bar (B/I/list/heading) | Tiptap editor instance |
| `PinInput` | 4-6 digit numpad UI | usePinAuth |

### Data Flow

```
App load
  -> PinGate checks sessionStorage('wintrack-unlocked')
  -> If not set: render PIN input (full-screen numpad)
  -> On correct PIN (hash match): sessionStorage.setItem, render <Outlet />
  -> Tab close clears sessionStorage automatically

Finance data flow:
  -> FinancePage holds `month` state (e.g. '2026-03')
  -> Child hooks receive month as parameter
  -> useTransactions(month) -> supabase.from('transactions').eq('month', month)
  -> useDashboard(month) -> supabase.rpc('get_dashboard_snapshot', { p_month })
  -> Mutations follow optimistic update pattern from useWins

Journal rich text flow:
  -> Tiptap useEditor({ extensions: [StarterKit], content: initialBody })
  -> Editor produces HTML string via editor.getHTML()
  -> Stored in existing `body` text column (HTML is valid text)
  -> Existing plain-text entries render correctly (text nodes in Tiptap)
  -> Read-only display: dangerouslySetInnerHTML (single-user, no XSS risk)
```

## Integration Architecture Decisions

### 1. PIN Gate — Client-Side Lock Screen

**Confidence: HIGH**

This is NOT authentication. The Supabase access pattern (static JWT + anon key) remains unchanged. The PIN prevents casual physical access — same as a phone lock screen.

**Implementation:**

```
src/components/auth/PinGate.tsx    — Layout route: renders Outlet or lock screen
src/components/auth/PinInput.tsx   — Numpad UI with dot indicators
src/hooks/usePinAuth.ts           — verify(pin), setPin(pin), hasPin, clearPin
```

**How it works:**
- PIN stored as SHA-256 hash in `user_settings` table (new column: `pin_hash text`)
- On app load: `PinGate` checks `sessionStorage.getItem('wintrack-unlocked')`
- If absent and PIN is set: render full-screen lock (PinInput component)
- On correct entry: `sessionStorage.setItem('wintrack-unlocked', 'true')`, render `<Outlet />`
- Session clears on tab close (sessionStorage default behavior)
- No PIN set: skip gate entirely (first-run experience unchanged)
- Settings page gets a "Set PIN" / "Change PIN" / "Remove PIN" section
- Rate limiting: 5 failed attempts triggers 30-second coolout (client-side timer)

**Router integration — PinGate as layout route:**

```tsx
// App.tsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: PinGate,       // layout route: renders Outlet when unlocked
    children: [
      {
        Component: AppShell,
        children: [
          { index: true, Component: TodayPage },
          { path: "journal", Component: JournalPage },
          { path: "finance", Component: FinancePage },
          { path: "settings", Component: SettingsPage },
        ],
      },
    ],
  },
]);
```

**Why SHA-256, not bcrypt:** Client-side only. No server-side brute force vector. SHA-256 via Web Crypto API is built into browsers, zero dependencies. The PIN is 4-6 digits — if someone has physical access AND developer tools, they can bypass the gate regardless of hash algorithm.

### 2. Finance Feature Integration

**Confidence: HIGH** (mirrors existing hook pattern exactly)

The 350 source app uses Next.js Server Actions with service role key. We port the data model and stored procedures but replace Server Actions with supabase-js client pattern (anon key + RLS).

**Database tables (new migration):**

```sql
-- Monthly budget configuration
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month text NOT NULL,              -- '2026-03'
  salary numeric NOT NULL DEFAULT 0,
  salary_received boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Recurring bills
CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  due_day integer,                  -- day of month (1-31)
  is_recurring boolean NOT NULL DEFAULT true,
  paid boolean NOT NULL DEFAULT false,
  month text NOT NULL,
  category text DEFAULT 'utilities',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Investment contributions
CREATE TABLE investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  contributed_amount numeric NOT NULL DEFAULT 0,
  month text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Individual transactions
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,               -- 'income' | 'expense' | 'investment'
  category text DEFAULT 'general',
  transaction_date text NOT NULL,   -- YYYY-MM-DD (matches wins date pattern)
  month text NOT NULL,              -- '2026-03' for quick month queries
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on all tables (same pattern as wins)
-- Indexes on (user_id, month) for all finance tables
```

**Stored procedures via supabase.rpc():**

Port the 350 app's stored procedures to Supabase SQL functions, called from client via RPC:

```typescript
// Dashboard aggregate
const { data } = await supabase.rpc('get_dashboard_snapshot', {
  p_user_id: USER_ID,
  p_month: '2026-03'
});

// Salary toggle (updates budget + creates income transaction atomically)
await supabase.rpc('apply_salary_received', {
  p_user_id: USER_ID,
  p_month: '2026-03'
});

// Copy recurring bills to new month
await supabase.rpc('rollover_recurring_bills', {
  p_user_id: USER_ID,
  p_from_month: '2026-02',
  p_to_month: '2026-03'
});

// Record investment contribution (updates investment + creates transaction)
await supabase.rpc('apply_investment_contribution', {
  p_user_id: USER_ID,
  p_investment_id: '...',
  p_amount: 5000
});
```

**Hook structure (matches existing convention):**

```
src/hooks/useTransactions.ts   — CRUD for transactions, filtered by month
src/hooks/useBudget.ts         — Monthly budget + salary toggle via RPC
src/hooks/useBills.ts          — Bills CRUD + paid toggle + rollover via RPC
src/hooks/useInvestments.ts    — Investment contributions + contribute via RPC
src/hooks/useDashboard.ts      — Calls get_dashboard_snapshot RPC, returns summary
```

Each hook takes `month: string` as parameter and follows the exact useState + useEffect + useCallback pattern established by useWins and useJournal.

**No Zustand store for finance data.** Finance data is page-scoped (only FinancePage and children use it). The existing pattern of hook-local state works perfectly. FinancePage holds `month` state and passes it down.

**Page and component structure:**

```
src/pages/FinancePage.tsx
src/components/finance/DashboardOverview.tsx     — Summary cards (balance, income, expenses)
src/components/finance/BudgetCard.tsx            — Monthly salary + salary-received toggle
src/components/finance/BillsList.tsx             — Bills list with paid toggle per bill
src/components/finance/InvestmentsList.tsx        — Investment progress bars
src/components/finance/TransactionList.tsx        — Scrollable transaction log
src/components/finance/AddTransactionOverlay.tsx  — Full-screen overlay (matches WinInputOverlay)
src/components/finance/MonthSelector.tsx          — Prev/next month navigation
src/types/finance.ts                             — TypeScript interfaces for all finance entities
```

### 3. Rich Text Journal Editor (Tiptap)

**Confidence: HIGH** (Tiptap is the standard headless editor for React; well-documented)

Replace the `<textarea>` in JournalEditorOverlay with Tiptap. Use StarterKit for core formatting.

**Packages:**
```bash
bun add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-character-count
```

**StarterKit includes:** Bold, Italic, Strike, Code, Heading (H1-H6), BulletList, OrderedList, ListItem, Blockquote, HorizontalRule, HardBreak, Paragraph, Text, Document, History (undo/redo).

That covers the requested features (bold, italic, bullet points) plus extras at no cost.

**Storage:** HTML string in existing `body` text column. No schema change needed. Existing plain-text entries are valid HTML (text nodes render fine in Tiptap).

**Integration changes to JournalEditorOverlay:**

```tsx
// Replace:
<textarea value={body} onChange={handleBodyChange} />

// With:
const editor = useEditor({
  extensions: [
    StarterKit,
    CharacterCount,  // for word counting
  ],
  content: initialBody,
  onUpdate: ({ editor }) => {
    bodyRef.current = editor.getHTML();
    setLiveWordCount(editor.storage.characterCount.words());
  },
});

// ...
<JournalToolbar editor={editor} />
<EditorContent editor={editor} className="flex-1 prose prose-invert ..." />
```

**JournalToolbar design:** Minimal bar matching Nothing aesthetic — monochrome toggle buttons. Uses `editor.chain().focus().toggleBold().run()` pattern. Buttons show active state via `editor.isActive('bold')`.

**Word count:** `@tiptap/extension-character-count` replaces the manual `wordCount()` function with accurate counting that handles HTML correctly.

**Read-only rendering in JournalEntryCard:** Use `dangerouslySetInnerHTML={{ __html: entry.body }}`. This is a single-user app with no untrusted input — no sanitization library needed.

### 4. TypeScript Migration Strategy

**Confidence: HIGH** (Vite handles mixed JS/TS natively with zero configuration)

Vite transpiles TypeScript files without needing any config changes — just rename `.jsx` to `.tsx`. The migration is incremental.

**Foundation setup:**
1. `bun add -D typescript` (types already installed: @types/react, @types/react-dom, @types/node)
2. Replace minimal `tsconfig.json` with proper config
3. Add `tsconfig.app.json` (app code) and `tsconfig.node.json` (vite config)
4. Rename `main.jsx` -> `main.tsx`, update `index.html` script src
5. Rename `App.jsx` -> `App.tsx`

**tsconfig.app.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

**Migration order (leaf-to-root):**
```
Phase A: lib/ (env, supabase, utils/date) — no component deps
Phase B: stores/ (uiStore, settingsStore) — depend only on lib/
Phase C: hooks/ (useWins, useJournal, etc.) — depend on lib/ + stores/
Phase D: components/ (leaves first: ui/, theme/, then larger ones)
Phase E: pages/ + App.tsx + main.tsx — depend on everything
```

**Critical rule: All new code is TypeScript from day one.** Finance hooks, components, pages, types — all `.ts`/`.tsx`. Only existing v1.0 `.jsx` files need migration. This means the migration happens naturally as files are touched, not as a separate phase.

### 5. Mobile Responsiveness

**Confidence: HIGH** (CSS-only changes, no architectural impact)

Current layout is desktop-fixed: `ml-14` offset for SideNav, `px-16` page padding, fixed 56px left SideNav.

**Responsive strategy:**
- **Desktop (md+):** Left SideNav, 56px wide, fixed — unchanged
- **Mobile (<md):** Bottom tab bar, 56px tall, fixed, 4-5 icon tabs

**Changes:**
- SideNav: add `@media (max-width: md)` styles for bottom bar mode
- AppShell: `ml-14 md:ml-14 ml-0` + `pb-16 md:pb-0` for bottom nav space
- TodayPage: `px-4 md:px-16` responsive padding
- FinancePage: design mobile-first (new code)
- JournalEditorOverlay: already partially responsive (`px-12 sm:px-20 lg:px-32`)

This is a layout concern, not an architectural one. No new components needed — SideNav becomes responsive.

## Patterns to Follow

### Pattern 1: Data Hook Convention (Existing — Extend)

Every data domain gets a custom hook encapsulating Supabase queries, local state, and optimistic updates. Components never call `supabase` directly.

```typescript
// src/hooks/useTransactions.ts — follows useWins pattern exactly
export function useTransactions(month: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('month', month)
      .order('transaction_date', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled && !error) setTransactions(data ?? []);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [month]);

  const addTransaction = useCallback(async (tx: NewTransaction) => {
    const optimistic = { id: `optimistic-${Date.now()}`, ...tx, created_at: new Date().toISOString() };
    setTransactions(prev => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from('transactions')
      .insert({ user_id: USER_ID, ...tx })
      .select()
      .single();

    if (error) {
      setTransactions(prev => prev.filter(t => t.id !== optimistic.id));
      return;
    }
    setTransactions(prev => prev.map(t => t.id === optimistic.id ? data : t));
  }, []);

  return { transactions, loading, addTransaction /* ... */ };
}
```

### Pattern 2: Overlay State Machine (Existing — Reuse)

Full-screen overlays use visible/exiting useState pair with onAnimationEnd unmount and createPortal to document.body.

```
AddTransactionOverlay -> follows JournalEditorOverlay pattern exactly
PinGate lock screen -> same portal + animation approach
```

### Pattern 3: Month-Scoped Finance Queries

All finance hooks take `month: string` (format: `'2026-03'`). FinancePage owns the month state and passes it down. This matches how the 350 source app partitions data.

```tsx
// FinancePage.tsx
const [month, setMonth] = useState(() => getCurrentMonth()); // '2026-03'
const { summary, loading } = useDashboard(month);
const { transactions } = useTransactions(month);
const { bills } = useBills(month);
```

### Pattern 4: RPC for Atomic Multi-Table Operations

Use `supabase.rpc()` for operations that touch multiple tables atomically (salary received, bill rollover, investment contribution). Client-side multi-step can partially fail. Stored procedures run in a single PostgreSQL transaction.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Zustand Store for Finance Data

**What:** Putting transactions, budgets, bills into a global Zustand store.
**Why bad:** Finance data is only needed by FinancePage subtree. Global state adds stale-data risk, unnecessary re-renders, and complexity. Existing pattern (hook-local state) works.
**Instead:** Custom hooks with useState + useEffect, same as useWins/useJournal.

### Anti-Pattern 2: Service Role Key in Client

**What:** Porting the 350 app's `createClient(serviceRoleKey)` to the SPA.
**Why bad:** Service role key bypasses RLS. Exposing it in client JS is a security hole.
**Instead:** Anon key + RLS (existing pattern). Stored procedures use `SECURITY DEFINER` only where needed, with internal user_id validation.

### Anti-Pattern 3: Big-Bang TypeScript Migration

**What:** Converting all 60+ files to TypeScript in one phase.
**Why bad:** Blocks all feature work, huge diff, high breakage risk.
**Instead:** Write all new code in TS. Migrate existing files incrementally as they are touched.

### Anti-Pattern 4: Markdown for Journal Body

**What:** Storing journal content as Markdown instead of HTML.
**Why bad:** Requires Markdown parser for display, lossy round-trip conversion, toolbar must generate Markdown syntax (poor UX). Tiptap natively produces/consumes HTML.
**Instead:** HTML in `body` column. Existing plain-text entries are valid HTML text nodes.

### Anti-Pattern 5: Real Auth for PIN

**What:** Using Supabase Auth with email/password for the PIN feature.
**Why bad:** Massive complexity for a single-user app. The PIN is a privacy screen, not security. Adding real auth changes the entire data access pattern.
**Instead:** Client-side SHA-256 hash comparison. Session flag in sessionStorage.

## New vs Modified Files Summary

### New Files (TypeScript from day one)

| Category | Files |
|----------|-------|
| Auth | `components/auth/PinGate.tsx`, `components/auth/PinInput.tsx`, `hooks/usePinAuth.ts` |
| Finance components | `pages/FinancePage.tsx`, `components/finance/DashboardOverview.tsx`, `BudgetCard.tsx`, `BillsList.tsx`, `InvestmentsList.tsx`, `TransactionList.tsx`, `AddTransactionOverlay.tsx`, `MonthSelector.tsx` |
| Finance hooks | `hooks/useTransactions.ts`, `hooks/useBudget.ts`, `hooks/useBills.ts`, `hooks/useInvestments.ts`, `hooks/useDashboard.ts` |
| Types | `types/finance.ts`, `types/common.ts` |
| Journal toolbar | `components/journal/JournalToolbar.tsx` |
| Database | `supabase/migrations/007_finance_tables.sql`, `008_finance_rpc.sql`, `009_pin_hash.sql` |

### Modified Files (rename to .tsx/.ts during modification)

| File | Change |
|------|--------|
| `App.jsx` -> `App.tsx` | Add PinGate layout route, /finance route |
| `main.jsx` -> `main.tsx` | Rename, update index.html |
| `AppShell.jsx` -> `AppShell.tsx` | Responsive layout (bottom bar on mobile) |
| `SideNav.jsx` -> `SideNav.tsx` | Add finance nav item, responsive bottom bar |
| `JournalEditorOverlay.jsx` -> `JournalEditorOverlay.tsx` | Tiptap integration |
| `settingsStore.js` -> `settingsStore.ts` | Add PIN hash to settings model |
| `SettingsPage.jsx` -> `SettingsPage.tsx` | Add PIN management UI section |
| `tsconfig.json` | Full TypeScript configuration |
| `package.json` | Add tiptap, typescript deps |
| `index.html` | Update script src to main.tsx |

### Unchanged Files (migrate later)

All other v1.0 components, hooks, and pages stay `.jsx`/`.js` until explicitly touched. Vite handles mixed JS/TS without any configuration.

## Suggested Build Order

Based on dependency analysis and blocking relationships:

```
1. TypeScript foundation (tsconfig, rename main/App, type definitions)
   -> Unblocks: everything else can be written in TS

2. PIN gate (independent of other features)
   -> Depends on: TS foundation, settingsStore modification
   -> Unblocks: nothing (parallel with 3-4)

3. Finance database (migrations, RPC functions, RLS policies)
   -> Depends on: nothing (pure SQL)
   -> Unblocks: finance hooks and page

4. Finance hooks + FinancePage
   -> Depends on: TS foundation, finance database
   -> Unblocks: nothing (self-contained)

5. Rich text journal (Tiptap)
   -> Depends on: TS foundation
   -> Unblocks: nothing (isolated to JournalEditorOverlay)

6. Mobile responsiveness
   -> Depends on: finance page existing (to make it responsive too)
   -> CSS-only changes to SideNav, AppShell, page layouts

7. Remaining TS migration (optional, as tech debt)
   -> Migrate untouched .jsx files leaf-to-root
```

Phases 2, 3, and 5 have no interdependencies and can theoretically run in parallel. Phase 4 depends on 3. Phase 6 benefits from 4 being done.

## Scalability Considerations

| Concern | At current scale | At 10K transactions | Mitigation |
|---------|------------------|---------------------|------------|
| Finance query speed | Instant | Still fast with month partition | Composite index on (user_id, month) |
| Journal body size | ~1KB plain text | ~2-5KB HTML | No concern — text column handles it |
| PIN brute force | N/A | Client-side only | Rate limit: 5 attempts, 30s coolout |
| Bundle size | ~200KB | +Tiptap ~80KB, +finance ~40KB | React.lazy for FinancePage and Tiptap |
| RPC function count | 0 | 4 stored procedures | Well within Supabase free tier |

## Sources

- [Tiptap React installation](https://tiptap.dev/docs/editor/getting-started/install/react) — HIGH confidence
- [Tiptap StarterKit extensions](https://tiptap.dev/docs/editor/extensions/overview) — HIGH confidence
- [Supabase RPC documentation](https://supabase.com/docs/reference/javascript/rpc) — HIGH confidence
- [Vite JS-to-TS migration](https://dev.to/rashidshamloo/migrating-a-vite-react-app-from-javascript-to-typescript-5dmn) — MEDIUM confidence
- [Vite mixed JS/TS support (official discussion)](https://github.com/vitejs/vite/discussions/6799) — HIGH confidence
- [Web Crypto API SubtleCrypto.digest()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) — HIGH confidence (for SHA-256 PIN hashing)

---
*Architecture research for: wintrack v2.0 — finance integration, PIN auth, TypeScript, rich text*
*Researched: 2026-03-16*
