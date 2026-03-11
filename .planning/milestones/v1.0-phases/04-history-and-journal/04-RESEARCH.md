# Phase 4: History & Journal - Research

**Researched:** 2026-03-10
**Domain:** Journal CRUD, historical win browsing, calendar/heatmap visualization, Supabase pagination
**Confidence:** HIGH

## Summary

Phase 4 completes v1 by adding the retrospective layer: a journal for daily reflection and a history view for browsing past wins with their check-in completion status plus a visual heatmap of active days. All infrastructure is already in place — the schema includes the `journal_entries` table from day one, `wins` and `check_ins` are populated from Phases 2 and 3, and the routing shell already routes to `/history` (HistoryPage.jsx) and `/journal` (JournalPage.jsx). Both pages are currently empty stubs.

The primary design challenge is the heatmap (HISTORY-02). This is the only novel visualization in the project. It must query wins across all dates, cross-reference check_in completion status, and render a grid of day cells in the Nothing Phone design language (dot grid, mono font, strictly black/white). No third-party calendar library is needed — a hand-rolled SVG or CSS grid of fixed-size cells, driven by a computed date-to-completion map, is the correct approach for this minimal aesthetic. Using an external calendar library would violate the design language.

Journal CRUD (JOURNAL-01, JOURNAL-02, JOURNAL-03) follows the exact pattern established in Phase 2 for wins: a hook (`useJournal`) backed by Supabase, optimistic updates, and an overlay or inline edit for entry creation/editing. The `journal_entries` table already exists with `title`, `body`, `created_at`, `updated_at`. The key difference from wins: journal entries need both a title and a body field, and entries are scoped to a day but the table has no explicit `entry_date` column — dates must be derived from `created_at` or a new `entry_date` column should be added if needed. Since `journal_entries` has no `win_date`-equivalent, the history list sorts by `created_at` descending.

**Primary recommendation:** Build `useJournal` hook mirroring `useWins` patterns (Supabase CRUD, optimistic updates), build `useHistory` hook for querying wins+check_ins across all dates, implement the heatmap as a pure CSS grid component driven by a computed data map. No new packages needed.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JOURNAL-01 | User can write a daily journal entry with a title and body | journal_entries table already exists (title text NOT NULL, body text NOT NULL DEFAULT ''); CRUD via useJournal hook; create/edit via inline form or overlay |
| JOURNAL-02 | User can edit or delete past journal entries | useJournal hook exposes editEntry(id, {title, body}) and deleteEntry(id); optimistic updates matching useWins pattern |
| JOURNAL-03 | User can browse past journal entries in a list view | JournalPage renders entry list sorted by created_at DESC; date header per entry derived from created_at using getLocalDateString |
| HISTORY-01 | User can browse past days' wins and their completion status | useHistory hook queries wins by date (paginated or range), joins check_ins to get completed status per win; HistoryPage shows selectable date and win list with completion badges |
| HISTORY-02 | App shows a visual calendar/heatmap of days with completed wins | Pure CSS grid component; date-to-completion map built by querying check_ins joined to wins; cells colored (or dot density varied) to distinguish active vs inactive days |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 (installed) | 19.x | Component state, effects | Project baseline |
| Supabase JS (installed) | 2.x | journal_entries CRUD, history queries | Project persistence layer |
| Zustand v5 (installed) | 5.x | Overlay open/close state for journal editor | Established uiStore pattern |
| motion/react (installed) | 12.x | Entry list animations, loading transitions | Project animation library |
| Lucide React (installed) | 0.577.x | Edit/Delete icons on journal cards | Project icon library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Intl.DateTimeFormat en-CA | browser built-in | Derive YYYY-MM-DD from created_at timestamps | Consistent with getLocalDateString() — no toISOString() |
| CSS Grid / Flexbox | browser built-in | Heatmap day cell layout | No library needed for simple date grid |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure CSS grid heatmap | react-calendar, react-heatmap-grid | External libraries impose their own styles — incompatible with Nothing Phone monochromatic design language. Hand-roll is correct here. |
| Sorting by created_at | Adding entry_date column | created_at is already in schema and sufficient for single-user app. entry_date would allow backdating but that's v2 scope. |
| Inline edit form (no overlay) | WinInputOverlay-style full-screen overlay | Journal editing (title + body textarea) benefits from more space — inline editing on the list card is acceptable for title-only edits but body editing needs more room. An inline expand or a dedicated edit form is better than a full overlay for journal. |

**Installation:** No new packages needed. All dependencies are present from Phases 1-3.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── history/
│   │   ├── Heatmap.jsx               # Visual calendar grid — days with completed wins
│   │   ├── Heatmap.test.jsx          # Tests: renders cells, highlights completed days
│   │   ├── DayDetail.jsx             # Single past day's win list + completion status
│   │   └── DayDetail.test.jsx        # Tests: shows win titles + completed/incomplete badges
│   └── journal/
│       ├── JournalEntryCard.jsx      # Single entry: title, body preview, date, edit/delete
│       ├── JournalEntryCard.test.jsx
│       ├── JournalEntryForm.jsx      # Create/edit form: title input + body textarea
│       └── JournalEntryForm.test.jsx
├── hooks/
│   ├── useJournal.js                 # CRUD: fetchEntries, addEntry, editEntry, deleteEntry
│   ├── useJournal.test.js
│   ├── useHistory.js                 # fetchWinsForDate(date), fetchCompletionMap()
│   └── useHistory.test.js
└── pages/
    ├── JournalPage.jsx               # Entry list + create button; inline or overlay editor
    └── HistoryPage.jsx               # Heatmap + selected-day win list
```

### Pattern 1: useJournal Hook (mirrors useWins)
**What:** Fetches all journal entries on mount, exposes addEntry/editEntry/deleteEntry with optimistic updates.
**When to use:** JournalPage is the single consumer of this hook.
**Example:**
```js
// Mirrors useWins pattern — same Supabase + optimistic update structure
export function useJournal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setEntries(data ?? []);
        setLoading(false);
      });
  }, []);

  const addEntry = useCallback(async ({ title, body }) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: USER_ID, title, body })
      .select()
      .single();
    if (!error) setEntries(prev => [data, ...prev]);
  }, []);

  const editEntry = useCallback(async (id, { title, body }) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, title, body } : e));
    await supabase
      .from('journal_entries')
      .update({ title, body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', USER_ID);
  }, []);

  const deleteEntry = useCallback(async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', USER_ID);
  }, []);

  return { entries, loading, addEntry, editEntry, deleteEntry };
}
```

### Pattern 2: useHistory Hook — Completion Map
**What:** Queries check_ins joined to wins (same join as useStreak) to build a `{ 'YYYY-MM-DD': boolean }` map. Also exposes fetchWinsForDate to get a specific day's wins with completion status.
**When to use:** Heatmap component and DayDetail component consume this hook from HistoryPage.
**Example:**
```js
// Reuses the same Supabase join pattern from useStreak
export function useHistory() {
  const [completionMap, setCompletionMap] = useState({}); // { date: hasAnyCompleted }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMap() {
      // Fetch ALL wins with their check_in status
      const { data, error } = await supabase
        .from('wins')
        .select('win_date, check_ins(completed)')
        .eq('user_id', USER_ID);

      if (error || !data) { setLoading(false); return; }

      // Build { YYYY-MM-DD: true } for days with at least one completed win
      const map = {};
      for (const win of data) {
        const hasCompleted = win.check_ins?.some(ci => ci.completed);
        if (hasCompleted) map[win.win_date] = true;
        else if (!map[win.win_date]) map[win.win_date] = false;
      }
      setCompletionMap(map);
      setLoading(false);
    }
    fetchMap();
  }, []);

  const fetchWinsForDate = useCallback(async (date) => {
    const { data } = await supabase
      .from('wins')
      .select('id, title, check_ins(completed, note)')
      .eq('user_id', USER_ID)
      .eq('win_date', date)
      .order('created_at', { ascending: true });
    return data ?? [];
  }, []);

  return { completionMap, loading, fetchWinsForDate };
}
```

### Pattern 3: Heatmap Component
**What:** Renders a fixed-size grid of day cells for a rolling window (e.g. last 12 weeks = 84 days). Each cell is colored or visually distinguished based on completionMap. Nothing Phone aesthetic: cells are small squares with no color — completed days use `bg-foreground`, empty/incomplete days use `bg-border` or similar muted fill.
**When to use:** HistoryPage.
**Example:**
```jsx
// Pure CSS grid — no library
// Cells: 7 rows (days of week) x N columns (weeks), or simpler: 84 cells in a flow grid
export default function Heatmap({ completionMap }) {
  const days = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = getLocalDateString(d);
    days.push({ date: dateStr, completed: completionMap[dateStr] === true });
  }

  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
      {days.map(({ date, completed }) => (
        <div
          key={date}
          title={date}
          className={`aspect-square rounded-[1px] ${
            completed ? 'bg-foreground' : 'bg-border'
          }`}
        />
      ))}
    </div>
  );
}
```

### Pattern 4: Journal Entry Form (Inline Expand)
**What:** Clicking "New Entry" reveals an inline form below the header (not a full-screen overlay). Title input + textarea for body. Submit inserts via useJournal. Editing an existing entry replaces the card with the same form fields pre-filled.
**When to use:** JOURNAL-01 creation and JOURNAL-02 editing. Inline is preferred over full overlay since body text benefits from scrollable content area on the page.
**Example:**
```jsx
// Inline expand pattern — no portal needed
function JournalEntryForm({ initialTitle = '', initialBody = '', onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title: title.trim(), body: body.trim() }); }}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full bg-transparent border-b border-border outline-none font-mono text-sm mb-3"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={5}
        placeholder="Write your entry..."
        className="w-full bg-transparent border border-border rounded p-2 font-mono text-sm resize-none outline-none"
      />
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={!title.trim()}>Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
```

### Anti-Patterns to Avoid
- **Using `toISOString().slice(0,10)` to derive dates from `created_at`:** The `created_at` field is UTC timestamptz. To display the local date label, parse with `new Date(created_at)` then `getLocalDateString(new Date(created_at))`. Never slice the ISO string.
- **Querying wins for completion status without joining check_ins:** The wins table has no `completed` column. Completion lives in check_ins. Always join or do a second query.
- **Building a heatmap with a third-party calendar library:** The Nothing Phone design language is strictly monochromatic. External calendar components bring their own color systems and will fight the design. Use a CSS grid.
- **Loading all historical wins on HistoryPage mount without pagination:** For a personal app with a year of data this is fine, but the completionMap query should select only `win_date, check_ins(completed)` — not `select('*')` with all columns — to keep the payload minimal.
- **Forgetting updated_at on journal edits:** The schema has `updated_at timestamptz NOT NULL DEFAULT now()`. Supabase does NOT auto-update this on `UPDATE` — the hook must explicitly set `updated_at: new Date().toISOString()` in the update payload.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone-safe date string from timestamp | Manual offset math | `getLocalDateString(new Date(created_at))` | Established utility already handles DST and timezone offset |
| Supabase optimistic update with rollback | Custom error recovery | Mirror useWins optimistic pattern | Same shape: set state optimistically, on error revert |
| Heatmap day-grid layout | Complex date math for week-grid offsets | Simple `Array.from` loop building N-day window, flat grid | Week-aligned grid adds complexity for no UX gain in this design language |

**Key insight:** Phase 4 is pure extension work. The hooks (useJournal, useHistory) are the same Supabase + useState + useCallback shape as useWins. The components (JournalEntryCard, Heatmap, DayDetail) are simpler than Phase 2's WinCard because there are no timers. The design challenge is keeping the Nothing Phone aesthetic intact in the heatmap and journal UI.

---

## Common Pitfalls

### Pitfall 1: journal_entries has no entry_date column — date comes from created_at
**What goes wrong:** Developer tries to filter by date field `entry_date` — column does not exist.
**Why it happens:** The schema (001_initial_schema.sql) has `created_at timestamptz` but no `win_date`-equivalent. The Phases 1-3 pattern was to add `win_date text` on wins; journal_entries did not get a parallel field.
**How to avoid:** Sort and group entries by `getLocalDateString(new Date(created_at))`. Do not add a migration unless the phase plan explicitly calls for it. For Phase 4 v1, `created_at` is sufficient — entries are created today.
**Warning signs:** Supabase query error "column journal_entries.entry_date does not exist."

### Pitfall 2: updated_at does NOT auto-update in Supabase
**What goes wrong:** Developer calls `.update({ title, body })` without `updated_at` — the column stays at its creation value even after edits.
**Why it happens:** PostgreSQL `DEFAULT now()` only fires on INSERT, not UPDATE. There is no trigger in the migration to auto-set updated_at on UPDATE.
**How to avoid:** Always include `updated_at: new Date().toISOString()` in the `update()` payload. Or add a trigger migration — but a trigger requires a new migration file. The simpler path is setting it from the client.
**Warning signs:** Entry shows old timestamp after edit; sort-by-updated_at produces wrong order.

### Pitfall 3: History query must join check_ins through wins, not wins through check_ins
**What goes wrong:** Developer queries check_ins and tries to get win_date — check_ins has no win_date column.
**Why it happens:** Same schema constraint as useStreak. The wins table has win_date; check_ins only has win_id FK.
**How to avoid:** Query wins with `select('win_date, check_ins(completed)')` — Supabase resolves the FK relation automatically. Or use the pattern established in useStreak: `from('check_ins').select('win_id, wins(win_date)')`.
**Warning signs:** Empty heatmap; completionMap always {}; query error on undefined column.

### Pitfall 4: Heatmap date window must use getLocalDateString, not toISOString
**What goes wrong:** The loop generating day cells uses `new Date(today - i * 86400000).toISOString().slice(0,10)` — produces UTC dates that don't match the `win_date` YYYY-MM-DD stored by the client (local timezone).
**Why it happens:** The win_date values in the DB were stored by `getLocalDateString()` (local timezone). Comparing to UTC-derived strings will produce mismatches near midnight.
**How to avoid:** Use `getLocalDateString(new Date(today.getTime() - i * 86400000))` for every day in the heatmap loop.
**Warning signs:** Heatmap cells show incomplete on days the user actually completed wins, especially in timezones with negative UTC offsets.

### Pitfall 5: Deleting a journal entry while editing it
**What goes wrong:** User clicks delete while an inline edit form is open for that entry — React state desync or double-delete attempt.
**Why it happens:** JournalPage tracks which entry is in edit mode as local state; delete fires before edit is cancelled.
**How to avoid:** Clear the editing state before calling deleteEntry, or hide the delete button while an entry is in edit mode. Simple guard: if `editingId === id`, do not show delete button.
**Warning signs:** TypeError on entry access after deletion; console warning about update on unmounted component.

### Pitfall 6: Supabase FK join direction matters
**What goes wrong:** `select('check_ins(completed)')` from wins works; `select('wins(win_date)')` from check_ins works. But reversing the direction fails without a matching FK in the schema.
**Why it happens:** Supabase FK join resolution follows the FK definition. check_ins.win_id references wins.id — so from check_ins you can embed wins(fields), and from wins you can embed check_ins(fields).
**How to avoid:** Both directions are valid given the schema. Use whichever is more natural for the query. For completionMap: querying wins and embedding check_ins(completed) is simpler (no deduplication needed). For streak (already implemented): querying check_ins and embedding wins(win_date) is simpler.
**Warning signs:** Supabase error "Could not find a relationship between 'wins' and 'check_ins'"; likely a column name typo.

---

## Code Examples

Verified patterns from existing codebase:

### journal_entries Schema (from 001_initial_schema.sql)
```sql
CREATE TABLE IF NOT EXISTS journal_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: separate per-operation policies (wins pattern)
```

### Supabase Insert with Select (from useWins.addWin)
```js
// Source: src/hooks/useWins.js — addWin pattern
const { data, error } = await supabase
  .from('journal_entries')
  .insert({ user_id: USER_ID, title, body })
  .eq('user_id', USER_ID)
  .select()
  .single();
```

### Deriving Local Date from Timestamp
```js
// Source: src/lib/utils/date.js — getLocalDateString pattern
// For journal entry date display:
import { getLocalDateString } from '@/lib/utils/date';

const entryDate = getLocalDateString(new Date(entry.created_at));
// Returns YYYY-MM-DD in user's local timezone — NOT UTC
```

### Zustand v5 Store Pattern (from uiStore.js)
```js
// Source: src/stores/uiStore.js — existing pattern (no double-parens needed here)
// To add journal overlay state:
export const useUIStore = create((set) => ({
  // existing Phase 2+3 state...
  // Phase 4 additions:
  journalFormOpen: false,
  editingJournalId: null,
  openJournalForm: () => set({ journalFormOpen: true }),
  closeJournalForm: () => set({ journalFormOpen: false }),
  setEditingJournal: (id) => set({ editingJournalId: id }),
  clearEditingJournal: () => set({ editingJournalId: null }),
}));
```

### Supabase FK Join — wins embedding check_ins
```js
// Pattern verified from useStreak.js (inverse direction, same FK)
// Source: src/hooks/useStreak.js
const { data } = await supabase
  .from('check_ins')
  .select('win_id, wins(win_date)')   // check_ins → wins
  .eq('user_id', USER_ID)
  .eq('completed', true);

// Inverse (for history/heatmap):
const { data } = await supabase
  .from('wins')
  .select('win_date, check_ins(completed)')  // wins → check_ins
  .eq('user_id', USER_ID);
```

### AnimatePresence List Pattern (from WinList, motion/react)
```jsx
// Source: src/components/wins/WinList.jsx — established list animation pattern
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence>
  {entries.map((entry) => (
    <motion.div
      key={entry.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <JournalEntryCard entry={entry} />
    </motion.div>
  ))}
</AnimatePresence>
```

---

## Schema Deep-Dive

### journal_entries Table (already exists — no migration needed)
```
id         uuid PK
user_id    uuid NOT NULL
title      text NOT NULL
body       text NOT NULL DEFAULT ''
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```

Key observations:
- No `entry_date` column — date is derived from `created_at` at display time
- `updated_at` has no auto-update trigger — must be set explicitly by client on edit
- No unique constraint on (user_id, date) — multiple entries per day are allowed (by design)
- `body` defaults to `''` — allows title-only entries

### wins + check_ins for History (no migration needed)
The completionMap needs:
- `wins.win_date` — the YYYY-MM-DD date string (local timezone, set by client)
- `check_ins.completed` — boolean, whether that win was marked complete in check-in
- `check_ins.win_id` — FK linking the two tables

The DayDetail view needs per-win:
- `wins.title` — display text
- `check_ins.completed` — yes/no badge
- `check_ins.note` — optional reflection (could be shown as hover or expand)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package, import from `motion/react` | motion v12 rebranding | Must use `motion/react` — project-wide decision from Phase 2 |
| tw-animate-css utilities | Plain `@keyframes` in `index.css` | Phase 2 fix | tw-animate-css conflicts with motion v12 CSS translate — overlays use `.overlay-enter`/`.overlay-exit` |
| `darkMode: 'class'` in tailwind.config | `@custom-variant dark` in index.css | Tailwind v4 | No tailwind.config.js darkMode option in v4 |
| `supabase.create()(fn)` double-parens | `create((set) => ...)` single-call | Active codebase | Existing uiStore.js uses single-call create — preserve this; double-parens only needed with middleware |

**Deprecated/outdated:**
- `framer-motion` imports: replaced by `motion/react` — do not use framer-motion package name
- `tw-animate-css` `animate-in` utilities: generate no CSS in this setup — use plain keyframes
- `toISOString().slice(0,10)` for local dates: corrupts timezone — use `getLocalDateString()`

---

## Open Questions

1. **Should HistoryPage show a clickable heatmap (tap day → show wins) or separate sections?**
   - What we know: No CONTEXT.md for Phase 4 — no locked user decision on interaction model
   - What's unclear: Whether the heatmap cells are buttons that update a "selected day" state in the page, or whether DayDetail is always visible showing the most recent day
   - Recommendation: Clickable cells updating `selectedDate` local state in HistoryPage is the simplest pattern. Default selectedDate = today (or most recent day with data).

2. **Does JournalPage need a dedicated "edit" overlay or is inline sufficient?**
   - What we know: No CONTEXT.md. Journal body can be multi-paragraph.
   - Recommendation: Inline expand is simpler and avoids the createPortal complexity. A `useState({ editingId, formOpen })` in JournalPage controls which card is in edit mode.

3. **Heatmap window: rolling 84 days (12 weeks) or calendar month grid?**
   - What we know: No user preference stated. Requirements say "visual calendar / heatmap."
   - Recommendation: Rolling 84-day (12-week) window is simplest to implement without month/year navigation. A 7×12 grid is self-contained and shows ~3 months of history without pagination. Can be expanded to a proper month grid in v2.

4. **journal_entries updated_at: client-set or database trigger?**
   - What we know: No trigger exists in current migration. Client must set updated_at explicitly.
   - Recommendation: Set from client in editEntry. If a trigger is desired, a migration `002_journal_updated_at_trigger.sql` would be needed. For v1 single-user app, client-set is fine.

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library (jsdom) |
| Config file | `vitest.config.js` (root) |
| Quick run command | `mise exec -- npx vitest run --reporter=verbose` |
| Full suite command | `mise exec -- npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JOURNAL-01 | useJournal.addEntry() inserts row into journal_entries | unit | `mise exec -- npx vitest run src/hooks/useJournal.test.js` | ❌ Wave 0 |
| JOURNAL-01 | JournalEntryForm renders title input + body textarea, calls onSubmit on save | unit | `mise exec -- npx vitest run src/components/journal/JournalEntryForm.test.jsx` | ❌ Wave 0 |
| JOURNAL-01 | JournalEntryForm disables Save when title is empty | unit | same | ❌ Wave 0 |
| JOURNAL-02 | useJournal.editEntry() updates entry in state and calls Supabase update with updated_at | unit | `mise exec -- npx vitest run src/hooks/useJournal.test.js` | ❌ Wave 0 |
| JOURNAL-02 | useJournal.deleteEntry() removes entry from state and calls Supabase delete | unit | same | ❌ Wave 0 |
| JOURNAL-02 | JournalEntryCard shows edit and delete buttons; delete calls onDelete | unit | `mise exec -- npx vitest run src/components/journal/JournalEntryCard.test.jsx` | ❌ Wave 0 |
| JOURNAL-03 | JournalPage renders list of entries sorted by created_at DESC | unit | `mise exec -- npx vitest run src/pages/JournalPage.test.jsx` | ❌ Wave 0 |
| JOURNAL-03 | Empty state renders when no entries exist | unit | same | ❌ Wave 0 |
| HISTORY-01 | useHistory.fetchWinsForDate(date) returns wins with check_in completion status | unit | `mise exec -- npx vitest run src/hooks/useHistory.test.js` | ❌ Wave 0 |
| HISTORY-01 | DayDetail renders win titles with completed/incomplete badges | unit | `mise exec -- npx vitest run src/components/history/DayDetail.test.jsx` | ❌ Wave 0 |
| HISTORY-02 | useHistory completionMap contains date keys with boolean values | unit | `mise exec -- npx vitest run src/hooks/useHistory.test.js` | ❌ Wave 0 |
| HISTORY-02 | Heatmap renders N cells for N days in the window | unit | `mise exec -- npx vitest run src/components/history/Heatmap.test.jsx` | ❌ Wave 0 |
| HISTORY-02 | Heatmap applies distinct className/style for completed vs incomplete cells | unit | same | ❌ Wave 0 |
| JOURNAL-01 | Journal entry create flow works end-to-end — form opens, title+body entered, saved, appears in list | manual-only | visual acceptance | N/A |
| JOURNAL-02 | Edit and delete work visually — inline form pre-fills, save updates card, delete removes it | manual-only | visual acceptance | N/A |
| HISTORY-02 | Heatmap correctly highlights days with completed wins vs days without | manual-only | visual acceptance (requires live Supabase data) | N/A |

### Sampling Rate
- **Per task commit:** `mise exec -- npx vitest run src/hooks/useJournal.test.js src/hooks/useHistory.test.js src/components/journal/JournalEntryCard.test.jsx src/components/history/Heatmap.test.jsx`
- **Per wave merge:** `mise exec -- npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useJournal.test.js` — covers JOURNAL-01, JOURNAL-02 (CRUD operations + Supabase mock)
- [ ] `src/hooks/useHistory.test.js` — covers HISTORY-01, HISTORY-02 (completionMap + fetchWinsForDate)
- [ ] `src/components/journal/JournalEntryForm.test.jsx` — covers JOURNAL-01 (form rendering, submit, validation)
- [ ] `src/components/journal/JournalEntryCard.test.jsx` — covers JOURNAL-02 (edit/delete buttons)
- [ ] `src/components/history/Heatmap.test.jsx` — covers HISTORY-02 (cell count, completed/incomplete class)
- [ ] `src/components/history/DayDetail.test.jsx` — covers HISTORY-01 (win list with badges)
- [ ] `src/pages/JournalPage.test.jsx` — covers JOURNAL-03 (list rendering, empty state)

*(No new framework install or shared fixtures needed — existing vitest.config.js + test-setup.js cover all gaps)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `supabase/migrations/001_initial_schema.sql`, `src/hooks/useWins.js`, `src/hooks/useStreak.js`, `src/hooks/useCheckin.js`, `src/stores/uiStore.js`, `src/pages/TodayPage.jsx`, `src/pages/HistoryPage.jsx`, `src/pages/JournalPage.jsx`, `src/components/checkin/CheckInOverlay.jsx`, `src/components/layout/BottomTabBar.jsx`
- Established test patterns — `src/hooks/useStreak.test.js`, `src/hooks/useCheckin.test.js`, `src/components/checkin/CheckInOverlay.test.jsx`
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — project decisions
- `.planning/phases/03-daily-loop-closure/03-RESEARCH.md` — previous research document (patterns to follow)
- `package.json` — confirmed installed libraries and versions

### Secondary (MEDIUM confidence)
- Supabase JS v2 FK join syntax (`select('relation(field)')`) — confirmed used successfully in `useStreak.js` for the `check_ins → wins` direction; inverse direction `wins → check_ins` follows the same FK definition and should work identically

### Tertiary (LOW confidence)
- None — all research grounded in existing codebase and confirmed patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in active use
- Architecture: HIGH — patterns are direct extensions of Phase 2/3 established code; hooks mirror useWins shape exactly
- Pitfalls: HIGH — identified from direct schema inspection, MEMORY.md, and Phase 3 lessons
- Heatmap implementation: MEDIUM — CSS grid approach is verified correct; Supabase `wins → check_ins` join direction should be confirmed during Wave 0 before committing to implementation

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack; Supabase JS v2 API stable; no external dependencies to expire)
