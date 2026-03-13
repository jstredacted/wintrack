# Phase 03: Categories and Reporting — Research

**Researched:** 2026-03-14
**Domain:** Win categorization, Supabase schema migration, per-category reporting/aggregation, React UI (inline dropdown, summary view)
**Confidence:** HIGH

## Summary

Phase 3 adds categories to win items (not journal entries, which are already categorized) and surfaces per-category completion counts as a reporting summary. The `wins` table currently has no category column. The WinInputOverlay captures only a win title and must be extended to accept a category selection. WinCard in TodayPage and TimelineItem in DayDetail both need to display the category. A new reporting view or section needs to compute and display per-category counts (e.g., "Work: 3/5 completed today").

The phase is bounded in scope by three natural sub-problems: (1) DB migration — add `category` column to `wins` table, (2) win creation UX — let the user pick a category in the input overlay, and (3) reporting surface — show per-category completion counts somewhere in the UI (Today page summary or a dedicated section).

The existing journal category pattern (three buttons in JournalEditorOverlay, badge on JournalEntryCard) is a direct design template to follow for win categories. The project stack and conventions are all already established — no new libraries are needed.

**Primary recommendation:** Mirror the journal category pattern for wins: add a `category text NOT NULL DEFAULT 'work'` column to `wins`, add category buttons in WinInputOverlay (after title submit or inline), show category badge on WinCard, and add a per-category summary bar to TodayPage computed from the local `wins` array (no new DB query needed).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-01 | User can assign a category to a win when creating it | WinInputOverlay extension pattern mirrors JournalEditorOverlay categories |
| CAT-02 | Category persists to Supabase `wins` table | DB migration adds `category` column; `addWin` in useWins passes it |
| CAT-03 | Category badge is visible on WinCard in TodayPage | Existing badge pattern from JournalEntryCard; TodayPage `wins` array already has full row data |
| CAT-04 | Category badge is visible on TimelineItem in DayDetail history view | `fetchWinsForDate` needs `category` added to its select; TimelineItem renders badge |
| CAT-05 | TodayPage shows per-category completion counts for today's wins | Computed client-side from `wins` array — no new DB query; group by category, count completed |
| CAT-06 | User can change a win's category after creation (edit flow) | `editWin` in useWins needs a `category` param; WinCard edit mode or hover action |

*Note: CAT-06 is optional scope — the planner should assess whether inline category editing is in scope for Phase 3 or deferred. The research surfaces it as a natural companion to CAT-01.*
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component state, category selection UI | Already in project |
| Tailwind v4 | 4.x | Category badge styling, summary layout | Already in project |
| Supabase JS | 2.x | `wins` category column CRUD | Already in project |
| Lucide React | latest | Optional tag/folder icon for category visual | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest + @testing-library/react | already installed | Category rendering tests, summary count tests | All new interactive components |
| @testing-library/user-event | already installed | Category button click simulation | Selection tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Button row category selector (journal pattern) | Native `<select>` dropdown | Button row matches existing project aesthetic (monochrome, uppercase font-mono); native select does not match |
| Client-side aggregation for completion counts | Supabase `.group()` query | Client-side aggregation over today's already-fetched `wins` array is zero-cost and requires no new query; Supabase group is overkill |
| Badge on WinCard for category | No badge (category implied) | Badge provides a visual cue that reinforces the categorization was saved; consistent with JournalEntryCard pattern |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   └── useWins.js               # addWin gains category param; editWin gains category param
├── components/
│   └── wins/
│       ├── WinInputOverlay.jsx  # category selector buttons added after title field
│       ├── WinCard.jsx          # category badge rendered below title
│       └── CategorySummary.jsx  # new component: per-category completion counts
├── components/
│   └── history/
│       └── DayDetail.jsx        # TimelineItem gains category badge
└── pages/
    └── TodayPage.jsx            # CategorySummary placed below wins list or above action buttons
```

`CategorySummary` is the only new file. All other changes are additive modifications to existing files.

### Pattern 1: DB Migration — Add category to wins

**What:** A new SQL migration file adds `category` column with CHECK constraint and DEFAULT matching the journal pattern.
**When to use:** Any schema change in this project.

```sql
-- File: supabase/migrations/004_add_category_to_wins.sql
-- Source: established migration pattern from 002_phase01_changes.sql
ALTER TABLE wins
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'work'
    CHECK (category IN ('work', 'personal', 'health'));
```

The three category values are a reasonable starting point. The exact set is a user decision — research leaves this as `## Claude's Discretion` if no CONTEXT.md constraint exists. Common triads for a personal productivity tool: `work / personal / health` or `work / life / growth`. The constraint pattern mirrors `journal_entries.category`.

### Pattern 2: Category Selector in WinInputOverlay

**What:** Button row (identical visual pattern to JournalEditorOverlay) for category selection. Category state held in overlay. Passed to `onSubmit` alongside the title.
**When to use:** Any category selection in this project's overlays.

```jsx
// Source: src/components/journal/JournalEditorOverlay.jsx — CATEGORIES pattern
const WIN_CATEGORIES = [
  { value: 'work',     label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health',   label: 'Health' },
];

// Inside WinInputOverlay — local state
const [category, setCategory] = useState('work');

// Selector row — above or below the title input
<div className="flex gap-3 mb-4">
  {WIN_CATEGORIES.map(c => (
    <button
      key={c.value}
      type="button"
      onClick={() => setCategory(c.value)}
      className={`font-mono text-xs uppercase tracking-[0.2em] px-2 py-1 border
        ${category === c.value
          ? 'border-foreground text-foreground'
          : 'border-border text-muted-foreground'}`}
    >
      {c.label}
    </button>
  ))}
</div>
```

**Multi-win entry consideration:** WinInputOverlay stays open after each submit for multi-win entry. The selected category should persist across submissions within the same overlay session (user sets "Work" once, all subsequent wins in the session are "Work" unless changed). This matches user mental model — batched intention-setting is likely category-coherent.

### Pattern 3: addWin Signature Extension

**What:** `addWin` gains a second parameter (or an options object) for category. The optimistic insert includes `category`.
**When to use:** Any extension of useWins CRUD.

```javascript
// Source: src/hooks/useWins.js — existing addWin pattern extended
const addWin = useCallback(async (title, category = 'work') => {
  const today = getLocalDateString();
  const optimistic = {
    id: `optimistic-${Date.now()}`,
    user_id: USER_ID,
    title,
    category,
    win_date: today,
    status: 'pending',
    completed: false,
    created_at: new Date().toISOString(),
  };

  setWins((prev) => [...prev, optimistic]);

  const { data, error: insertError } = await supabase
    .from('wins')
    .insert({ user_id: USER_ID, title, category, win_date: today })
    .eq('user_id', USER_ID)
    .select()
    .single();

  if (insertError) {
    setWins((prev) => prev.filter((w) => w.id !== optimistic.id));
    setError(insertError.message);
    return;
  }

  setWins((prev) => prev.map((w) => (w.id === optimistic.id ? data : w)));
  return data;
}, []);
```

Note: `addWin` signature changes from `(title)` to `(title, category)`. TodayPage's call site must be updated to pass `category` from WinInputOverlay's `onSubmit`. The `onSubmit` prop signature of WinInputOverlay needs to change from `(title: string)` to `(title: string, category: string)`.

### Pattern 4: Category Badge on WinCard

**What:** A small monochrome badge below (or beside) the title showing the category. Suppressed for the default category (mirrors journal: badge suppressed for `'daily'`).
**When to use:** Any categorical metadata on cards in this project.

```jsx
// Source: src/components/journal/JournalEntryCard.jsx — category badge pattern
{win.category && win.category !== 'work' && (
  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground border border-border px-1.5 py-0.5">
    {win.category}
  </span>
)}
```

Whether the DEFAULT category badge is suppressed is a design decision. The journal suppresses `'daily'` because it's the default — same logic applies here. The planner can decide if ALL categories should always show (simpler) or only non-default ones.

### Pattern 5: Per-Category Completion Summary (CategorySummary component)

**What:** A new `CategorySummary` component consumes the `wins` array prop and renders per-category groups with completion counts. Computed entirely client-side — no DB query.
**When to use:** Summary stats over an already-fetched collection.

```jsx
// Source: no direct model — derived from project design language
// File: src/components/wins/CategorySummary.jsx

export default function CategorySummary({ wins }) {
  if (!wins || wins.length === 0) return null;

  // Group wins by category, count completed per group
  const groups = wins.reduce((acc, win) => {
    const cat = win.category ?? 'work';
    if (!acc[cat]) acc[cat] = { total: 0, completed: 0 };
    acc[cat].total++;
    if (win.completed) acc[cat].completed++;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
      {Object.entries(groups).map(([cat, counts]) => (
        <span key={cat} className="uppercase tracking-[0.15em]">
          {cat}: {counts.completed}/{counts.total}
        </span>
      ))}
    </div>
  );
}
```

The component is purely presentational — no state, no side effects. It derives all data from the `wins` prop. Placement in TodayPage: between the wins list and the action buttons area, or as a header summary above the list.

### Pattern 6: fetchWinsForDate Needs category in Select

**What:** `useHistory.fetchWinsForDate` currently selects `id, title, check_ins(completed, note)`. Adding `category` to the select field exposes it in DayDetail's `TimelineItem`.
**When to use:** Any time win fields are added that should appear in history view.

```javascript
// Source: src/hooks/useHistory.js — fetchWinsForDate
const { data } = await supabase
  .from('wins')
  .select('id, title, category, check_ins(completed, note)')  // add category
  .eq('user_id', USER_ID)
  .eq('win_date', date)
  .order('created_at', { ascending: true });
```

### Anti-Patterns to Avoid

- **Don't add a new DB query for completion counts.** The `wins` array is already in component state on TodayPage. Client-side `reduce` over an array of ~5-10 items is instantaneous — no round-trip needed.
- **Don't use a native `<select>` dropdown.** The project design language uses button row selectors (see JournalEditorOverlay). A native `<select>` breaks the monochrome, font-mono aesthetic.
- **Don't add category filtering to the history view in this phase.** History DayDetail should display the category badge per win, but filtering/searching by category is v2 scope.
- **Don't show an empty CategorySummary.** If `wins.length === 0`, return `null` — the "No wins logged yet" state in WinList already handles the empty case.
- **Don't reset category selection on each win submission.** Within a multi-win session, keep the selected category sticky (user already chose their context for this batch).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Category aggregation query | Custom Supabase `.group()` RPC | `Array.reduce()` over in-memory `wins` | Data is already fetched; no new DB round-trip needed |
| Custom dropdown component | Radix Select, popover | Button row (3 options max) | 3 fixed options fit a flat button row perfectly; no flyout complexity |
| Category icon system | Custom SVG icons per category | Lucide icons (optional) or plain text badge | Text-only badge matches the project's monochrome design language |

## Common Pitfalls

### Pitfall 1: wins table has no category column yet

**What goes wrong:** Attempting to `.insert({ category: 'work' })` without the column causes a Supabase 400 error.
**Why it happens:** The `wins` table was created in migration 001 with no category column. Migration 003 only added `completed`. Phase 3 needs migration 004.
**How to avoid:** Write `004_add_category_to_wins.sql` as Wave 0 deliverable before writing application code. Apply in Supabase SQL editor.
**Warning signs:** Supabase returns `{ error: { code: '42703', message: "column wins.category does not exist" } }`.

### Pitfall 2: WinInputOverlay onSubmit signature change breaks TodayPage

**What goes wrong:** WinInputOverlay changes `onSubmit(title)` to `onSubmit(title, category)`. TodayPage passes `onSubmit` to `addWin` which only accepts one arg — category is silently dropped.
**Why it happens:** JavaScript ignores extra arguments — no type error. The DB insert just uses the DEFAULT.
**How to avoid:** Update TodayPage's `onSubmit` handler to destructure or receive both args: `onSubmit={async (title, category) => { await addWin(title, category); }}`. Write a test that asserts category is forwarded.
**Warning signs:** Category always shows as `'work'` (default) even when the user selected something else in the overlay.

### Pitfall 3: DevToolsPanel seeded wins have no category — breaks CategorySummary

**What goes wrong:** DevToolsPanel seeds wins without a `category` field. After migration, the DB inserts fall back to DEFAULT. But if the code does `win.category ?? 'work'`, everything is fine. If not guarded, `undefined` leaks into the summary.
**Why it happens:** DevToolsPanel doesn't set category explicitly. After the migration adds DEFAULT 'work', DB-returned rows will have `category: 'work'` — no issue. But optimistic objects in addWin that don't include `category` would have `category: undefined` until the DB response arrives.
**How to avoid:** Always include `category` in the optimistic insert object. Guard with `?? 'work'` in CategorySummary as a fallback.

### Pitfall 4: rollForward doesn't copy category

**What goes wrong:** `rollForward()` in useWins maps `yesterdayWins` using only `{ title }` — category is not included. Rolled-forward wins always get DEFAULT `'work'`.
**Why it happens:** `rollForward` uses a fixed `yesterdayWins.map(({ title }) => ...)` shape.
**How to avoid:** Update rollForward to include category: `yesterdayWins.map(({ title, category }) => ({ ..., category: category ?? 'work' }))`. Also, the yesterday wins query currently selects `title, id` — add `category` to the select.

### Pitfall 5: fetchWinsForDate select doesn't include category

**What goes wrong:** DayDetail TimelineItem tries to render `win.category` but it's `undefined` because the Supabase select didn't include it.
**Why it happens:** `useHistory.fetchWinsForDate` selects `id, title, check_ins(...)` — category was added to the table after this query was written.
**How to avoid:** Update the select string to include `category` when writing the migration.

## Code Examples

### DB Migration

```sql
-- File: supabase/migrations/004_add_category_to_wins.sql
-- Mirrors 002_phase01_changes.sql pattern for journal_entries.category
ALTER TABLE wins
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'work'
    CHECK (category IN ('work', 'personal', 'health'));
```

### CategorySummary — complete component

```jsx
// File: src/components/wins/CategorySummary.jsx
export default function CategorySummary({ wins }) {
  if (!wins || wins.length === 0) return null;

  const groups = wins.reduce((acc, win) => {
    const cat = win.category ?? 'work';
    if (!acc[cat]) acc[cat] = { total: 0, completed: 0 };
    acc[cat].total++;
    if (win.completed) acc[cat].completed++;
    return acc;
  }, {});

  const entries = Object.entries(groups);
  if (entries.length <= 1) return null; // only show if multiple categories exist

  return (
    <div className="flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
      {entries.map(([cat, counts]) => (
        <span key={cat} className="uppercase tracking-[0.15em]">
          {cat}: {counts.completed}/{counts.total}
        </span>
      ))}
    </div>
  );
}
```

Note: Hide the summary if all wins share the same category (single category — no breakdown is useful). Return `null` when `entries.length <= 1`.

### useWins addWin — updated signature

```javascript
// Signature change: addWin(title, category = 'work')
// Optimistic object includes category
// Insert includes category
const addWin = useCallback(async (title, category = 'work') => {
  const today = getLocalDateString();
  const optimistic = {
    id: `optimistic-${Date.now()}`,
    user_id: USER_ID,
    title,
    category,
    win_date: today,
    status: 'pending',
    completed: false,
    created_at: new Date().toISOString(),
  };
  setWins((prev) => [...prev, optimistic]);
  const { data, error: insertError } = await supabase
    .from('wins')
    .insert({ user_id: USER_ID, title, category, win_date: today })
    .eq('user_id', USER_ID)
    .select()
    .single();
  if (insertError) {
    setWins((prev) => prev.filter((w) => w.id !== optimistic.id));
    setError(insertError.message);
    return;
  }
  setWins((prev) => prev.map((w) => (w.id === optimistic.id ? data : w)));
  return data;
}, []);
```

### useWins rollForward — updated to include category

```javascript
// yesterdayWins query needs category added to select
// supabase.from('wins').select('title, id, category')...
const toInsert = yesterdayWins.map(({ title, category }) => ({
  user_id: USER_ID,
  title,
  category: category ?? 'work',
  win_date: today,
}));
```

### TodayPage onSubmit handler

```jsx
// Updated call site in TodayPage.jsx
<WinInputOverlay
  open={inputOverlayOpen}
  onSubmit={async (title, category) => {
    await addWin(title, category);
  }}
  onDone={closeInputOverlay}
  onClose={closeInputOverlay}
/>
```

### CategorySummary placement in TodayPage

```jsx
// After WinList, before action buttons
<WinList wins={wins} onEdit={...} onDelete={...} onToggle={...} />
{wins.length > 1 && <CategorySummary wins={wins} />}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Wins have no category | Wins have a category column (work/personal/health) | This phase | Enables per-category grouping and reporting |
| WinInputOverlay captures title only | WinInputOverlay captures title + category | This phase | User sets intention context at creation time |
| TodayPage shows flat wins list | TodayPage also shows per-category completion summary | This phase | Users can see progress breakdown by area |

**Deprecated/outdated:**
- `addWin(title)` single-arg signature: becomes `addWin(title, category)` in this phase.

## Open Questions

1. **What are the right category values for wins?**
   - What we know: Journal uses `daily | milestone | financial`. Wins are action-items, not reflections — different ontology. `work / personal / health` is a common productivity triad.
   - What's unclear: Whether the user has preferences. This is research's best recommendation.
   - Recommendation: Use `work | personal | health` as defaults. Planner should accept this or flag for user input before implementation.

2. **Should the default category badge be suppressed on WinCard?**
   - What we know: JournalEntryCard suppresses `category !== 'daily'` — only non-default shows a badge. Same logic would apply here: `category !== 'work'` shows badge.
   - What's unclear: Whether all categories should always be visible (cleaner information density) or only non-default ones (less visual noise for the majority of wins).
   - Recommendation: Suppress default badge (mirrors journal pattern, less visual clutter for common case).

3. **Should category be editable after creation (inline on WinCard)?**
   - What we know: `editWin` currently only updates `title`. Adding category editing requires extending `editWin` or adding a separate `setWinCategory` action.
   - What's unclear: Whether the user finds post-creation category editing valuable.
   - Recommendation: Defer to Phase 4 unless easy to include. Category is set at creation time; editing is an enhancement. The planner should include CAT-06 only if scope allows a clean implementation.

4. **Should CategorySummary appear when only one category is in use?**
   - What we know: A summary of one group (e.g., "Work: 2/5") has limited value vs. taking vertical space.
   - Recommendation: Hide CategorySummary when all wins share the same category (single-group case). Return `null` when `entries.length <= 1`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (with @testing-library/react, @testing-library/user-event) |
| Config file | vitest.config.js |
| Quick run command | `mise exec -- bun run test --run` |
| Full suite command | `mise exec -- bun run test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-01 | WinInputOverlay renders category selector buttons | unit | `mise exec -- bun run test --run src/components/wins/WinInputOverlay.test.jsx` | Exists (extend) |
| CAT-01 | WinInputOverlay calls onSubmit with (title, category) | unit | `mise exec -- bun run test --run src/components/wins/WinInputOverlay.test.jsx` | Exists (extend) |
| CAT-02 | addWin passes category to Supabase insert | unit | `mise exec -- bun run test --run src/hooks/useWins.test.js` | Exists (extend) |
| CAT-02 | addWin optimistic object includes category | unit | `mise exec -- bun run test --run src/hooks/useWins.test.js` | Exists (extend) |
| CAT-03 | WinCard renders category badge for non-default category | unit | `mise exec -- bun run test --run src/components/wins/WinCard.test.jsx` | Exists (extend) |
| CAT-03 | WinCard suppresses badge for default 'work' category | unit | `mise exec -- bun run test --run src/components/wins/WinCard.test.jsx` | Exists (extend) |
| CAT-04 | DayDetail TimelineItem renders category badge | unit | `mise exec -- bun run test --run src/components/history/DayDetail.test.jsx` | Exists (extend) |
| CAT-05 | CategorySummary computes correct counts per category | unit | `mise exec -- bun run test --run src/components/wins/CategorySummary.test.jsx` | ❌ Wave 0 |
| CAT-05 | CategorySummary returns null for single-category wins | unit | `mise exec -- bun run test --run src/components/wins/CategorySummary.test.jsx` | ❌ Wave 0 |
| CAT-05 | CategorySummary returns null when wins array is empty | unit | `mise exec -- bun run test --run src/components/wins/CategorySummary.test.jsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `mise exec -- bun run test --run`
- **Per wave merge:** `mise exec -- bun run test --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/wins/CategorySummary.test.jsx` — covers CAT-05 (new file; component doesn't exist yet)
- [ ] DB migration `supabase/migrations/004_add_category_to_wins.sql` — required before any Supabase integration; apply in Supabase SQL editor

*(All other test files exist — they need new test cases added, not created from scratch.)*

## Sources

### Primary (HIGH confidence)
- Direct codebase reading: `src/hooks/useWins.js`, `src/components/wins/WinCard.jsx`, `src/components/wins/WinInputOverlay.jsx`, `src/components/wins/WinList.jsx`, `src/pages/TodayPage.jsx`, `src/hooks/useHistory.js`, `src/components/history/DayDetail.jsx` — verified current implementation and data shapes
- `src/components/journal/JournalEditorOverlay.jsx` — category button row pattern (direct template for win category UX)
- `src/components/journal/JournalEntryCard.jsx` — category badge pattern (direct template for WinCard badge)
- `supabase/migrations/002_phase01_changes.sql` — category column migration pattern with CHECK constraint
- `supabase/migrations/003_add_completed_to_wins.sql` — column-add migration pattern
- `.planning/STATE.md` — established codebase decisions (optimistic update, Supabase query shapes, Tailwind v4, motion/react)

### Secondary (MEDIUM confidence)
- Phase 02 RESEARCH.md pattern — Wave 0 / Wave 1 / Wave 2 structure adapted for Phase 3

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new dependencies
- Architecture: HIGH — patterns derived directly from existing journal category implementation (direct code template)
- DB migration: HIGH — migration pattern proven in migrations 002 and 003
- Pitfalls: HIGH — derived from reading actual code (rollForward not copying category, onSubmit signature mismatch, fetchWinsForDate missing field)
- CategorySummary design: MEDIUM — shape is clear but exact placement/visibility rules (single-group suppression) are design decisions for the planner

**Research date:** 2026-03-14
**Valid until:** 2026-06-14 (stable stack — 90 days)
