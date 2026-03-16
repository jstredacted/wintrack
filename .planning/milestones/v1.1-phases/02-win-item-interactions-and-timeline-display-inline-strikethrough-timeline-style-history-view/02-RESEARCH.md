# Phase 02: Win Item Interactions and Timeline Display — Research

**Researched:** 2026-03-13
**Domain:** React UI interactions, Supabase data mutations, CSS timeline layout, Tailwind v4
**Confidence:** HIGH

## Summary

This phase adds two features to the existing wintrack codebase. First, inline strikethrough — users can mark a win as done at any point during the day, not just through the evening check-in. A click or tap toggles a `completed` boolean on the win row, renders the title with `line-through`, and persists the status to the `wins` table in Supabase. Second, the history DayDetail is redesigned as a vertical dot-and-line timeline: a column of dots connected by a vertical rule, each dot wired to a win card with a colored left-border accent. Timestamps are explicitly excluded per user direction.

Both features fit cleanly into the existing component and hook architecture. WinCard is the right home for the toggle affordance. DayDetail is the right home for the timeline redesign. No new routes, hooks, or DB tables are needed — the timeline is purely presentational, and the strikethrough requires only a single column addition to the `wins` table.

**Primary recommendation:** Add a `completed` boolean column to `wins` (default `false`, toggled via optimistic update in `useWins`), render strikethrough in WinCard on that field, and rebuild DayDetail as a pure CSS vertical timeline using a `::before` pseudo-element or a positioned `div` for the connecting line.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component rendering, local state | Already in project |
| Tailwind v4 | 4.x | Utility classes for layout and strikethrough | Already in project |
| motion/react | 12.x | Subtle transition when toggling strikethrough | Already in project — import from `motion/react` |
| Supabase JS | 2.x | Persisting `completed` column toggle | Already in project |
| Lucide React | latest | Optional check/circle icon for toggle affordance | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | already installed | Component interaction tests | All new interactive components |
| @testing-library/user-event | already installed | Click interaction simulation | Toggle click tests |
| vitest | already installed | Test runner | Phase test suite |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `line-through` via Tailwind `line-through` class | `text-decoration: line-through` inline style | Tailwind class is standard in this project; inline style has no benefit |
| Positioning connecting line via CSS pseudo-element | SVG vertical line | CSS is simpler, no SVG overhead for a static vertical rule |
| Optimistic toggle in useWins | Server-round-trip before UI update | Optimistic is the established pattern in this codebase (see addWin, editWin) |

**Installation:** No new packages required. All dependencies already present.

## Architecture Patterns

### Recommended Project Structure

No new files at the hooks or stores level. Changes are localized to:

```
src/
├── hooks/
│   └── useWins.js           # add toggleWinCompleted action
├── components/
│   └── wins/
│       └── WinCard.jsx      # add toggle affordance + strikethrough rendering
└── components/
    └── history/
        └── DayDetail.jsx    # rebuild WinRow as timeline item
```

For the history view, a new sub-component `TimelineItem` lives inside `DayDetail.jsx` (not a separate file, consistent with how `WinRow` is currently co-located in `DayDetail.jsx`).

### Pattern 1: Optimistic Toggle in useWins

**What:** Toggle `completed` on a win row locally first, then fire the Supabase update. On error, roll back.
**When to use:** Any boolean field where the user expects instant feedback.

```javascript
// Source: established codebase pattern from editWin / deleteWin in useWins.js
const toggleWinCompleted = useCallback(async (id, currentCompleted) => {
  const newCompleted = !currentCompleted;
  // Optimistic update
  setWins((prev) =>
    prev.map((w) => (w.id === id ? { ...w, completed: newCompleted } : w))
  );
  const { error: updateError } = await supabase
    .from('wins')
    .update({ completed: newCompleted })
    .eq('id', id)
    .eq('user_id', USER_ID);
  if (updateError) {
    // Rollback
    setWins((prev) =>
      prev.map((w) => (w.id === id ? { ...w, completed: currentCompleted } : w))
    );
    setError(updateError.message);
  }
}, []);
```

### Pattern 2: Strikethrough Rendering in WinCard

**What:** Conditionally apply `line-through text-muted-foreground` Tailwind classes on the title span based on `win.completed`.
**When to use:** Any status-reflecting text decoration in this codebase.

```jsx
// Source: Tailwind v4 utility classes, project font-mono baseline
<span
  className={[
    'flex-1 text-lg leading-snug font-mono',
    win.completed
      ? 'line-through text-muted-foreground'
      : 'text-foreground',
  ].join(' ')}
>
  {win.title}
</span>
```

Toggle affordance: a small circle/check button left of the title (or tapping the title area). Keep the existing Pencil/Trash actions on hover in their current position.

```jsx
// Toggle button — left of title, always visible (not hover-reveal)
<button
  aria-label={win.completed ? 'Mark incomplete' : 'Mark complete'}
  onClick={() => onToggle?.()}
  className="shrink-0 mt-0.5 text-muted-foreground/40 hover:text-foreground transition-colors"
>
  {win.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
</button>
```

### Pattern 3: CSS Vertical Timeline in DayDetail

**What:** A vertical connecting line implemented as a positioned `div` (full-height left border) with dots as small circles overlaid at each item. No timestamps per explicit user direction.
**When to use:** Ordered list of items requiring visual hierarchy without time labels.

```jsx
// Source: CSS positioning — no library needed
// TimelineItem replaces WinRow inside DayDetail.jsx
function TimelineItem({ win }) {
  const completed = win.check_ins?.[0]?.completed;
  const note = win.check_ins?.[0]?.note;

  return (
    <div className="relative pl-8 pb-6">
      {/* Connecting line — rendered as left border on a full-height pseudo-div */}
      {/* The line is drawn by the parent container's border-l, not per-item */}

      {/* Dot */}
      <div
        className={[
          'absolute left-0 top-1.5 w-3 h-3 rounded-full border-2',
          completed
            ? 'bg-foreground border-foreground'
            : 'bg-background border-border',
        ].join(' ')}
        style={{ transform: 'translateX(-5px)' }} // center on the line
      />

      {/* Card */}
      <div
        className={[
          'border-l-4 pl-4 py-2',
          completed ? 'border-foreground' : 'border-border/40',
        ].join(' ')}
      >
        <span
          className={[
            'font-mono text-sm block',
            completed ? 'line-through text-muted-foreground' : 'text-foreground',
          ].join(' ')}
        >
          {win.title}
        </span>
        {/* Status badge — retained from current DayDetail for consistency */}
        <span className={[
          'font-mono text-xs border px-1.5 py-0.5 rounded mt-1 inline-block',
          completed
            ? 'border-foreground text-foreground'
            : 'border-border text-muted-foreground',
        ].join(' ')}>
          {completed ? 'Completed' : 'Incomplete'}
        </span>
      </div>
    </div>
  );
}

// Container: border-l on the wrapper draws the continuous vertical line
<div className="border-l border-border ml-1.5">
  {wins.map(win => <TimelineItem key={win.id} win={win} />)}
</div>
```

### Anti-Patterns to Avoid

- **Don't use check_ins for the strikethrough on TodayPage.** The `wins.check_ins` join is the history view data shape (via `fetchWinsForDate`). TodayPage's `wins` array comes from a plain `select('*')` on the `wins` table, not a join. A dedicated `completed` boolean column on `wins` is the right field for daytime toggling.
- **Don't add timestamps to timeline items.** User explicitly said no time display. The timeline is dot-and-line visual order only.
- **Don't use a third-party timeline library.** The CSS approach (border-l + absolute dot) is 10 lines. No library justifies the dependency.
- **Don't make the toggle hover-reveal only.** Unlike edit/delete which are destructive secondary actions, the completion toggle is the primary daily action — it must be always-visible, not hidden on hover.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animated strikethrough transition | Custom keyframe animation | `transition-colors` on the span + motion `layout` | Tailwind transition + motion are already in place |
| Connecting line between dots | SVG paths, JS height calculations | CSS `border-l` on the container div | Static CSS — no JS needed for a vertical rule |
| DB toggle with rollback | Ad hoc fetch + setState | Same optimistic pattern as `editWin` in `useWins.js` | Pattern already proven in this codebase |

## Common Pitfalls

### Pitfall 1: wins table has no `completed` column yet

**What goes wrong:** Trying to `update({ completed: true })` without the column causes a Supabase 400/column-not-found error.
**Why it happens:** The `wins` table was created before this feature existed. The `status` column exists (`'pending'`) but is string-typed and used differently.
**How to avoid:** Write and apply a DB migration (`003_add_completed_to_wins.sql`) before implementing the hook action. Set `DEFAULT false NOT NULL`.
**Warning signs:** Supabase update returns `{ error: { code: '42703' } }` (undefined column).

### Pitfall 2: Optimistic toggle flips back on re-render

**What goes wrong:** Toggling `completed` optimistically, then a re-fetch triggered elsewhere overwrites the local state with stale DB data (still `false`).
**Why it happens:** If something triggers a full `fetchWins()` call (e.g., focus event, other state change) before the Supabase write completes, the local optimistic value is overwritten.
**How to avoid:** Do not add auto-refresh-on-focus to `useWins` in this phase. Current `useWins` fetches only on mount — no re-fetch triggers exist, so this is safe.

### Pitfall 3: `wins.completed` vs `wins.check_ins[0].completed` confusion

**What goes wrong:** Using `win.check_ins?.[0]?.completed` for the TodayPage strikethrough instead of `win.completed`.
**Why it happens:** DayDetail currently uses `check_ins` join data. TodayPage's win objects come from a different query shape (`select('*')` without join).
**How to avoid:** TodayPage `WinCard` reads `win.completed` (the new column). DayDetail `TimelineItem` reads `win.check_ins?.[0]?.completed` (the existing check-in result). These are two separate fields with two separate meanings.

### Pitfall 4: Timeline dot centering on the line

**What goes wrong:** The absolute-positioned dot visually sits beside the line, not on it.
**Why it happens:** The container `border-l` sits at `left: 0` of the container, but the dot's `left: 0` absolute position anchors to the padding box.
**How to avoid:** Use `ml-1.5` on the container and `left-0` + `translateX(-5px)` on the dot, or use the `ml-[7px]` trick where half the dot width equals the offset. Test visually in both dark and light mode.

## Code Examples

### DB Migration (SQL)

```sql
-- Source: Supabase SQL editor migration pattern used in this project
-- File: supabase/migrations/003_add_completed_to_wins.sql
ALTER TABLE wins ADD COLUMN completed boolean NOT NULL DEFAULT false;
```

### toggleWinCompleted hook action

```javascript
// Full implementation pattern — add to useWins.js return object
const toggleWinCompleted = useCallback(async (id) => {
  const current = wins.find((w) => w.id === id);
  if (!current) return;
  const newCompleted = !current.completed;

  setWins((prev) =>
    prev.map((w) => (w.id === id ? { ...w, completed: newCompleted } : w))
  );

  const { error: updateError } = await supabase
    .from('wins')
    .update({ completed: newCompleted })
    .eq('id', id)
    .eq('user_id', USER_ID);

  if (updateError) {
    setWins((prev) =>
      prev.map((w) => (w.id === id ? { ...w, completed: !newCompleted } : w))
    );
    setError(updateError.message);
  }
}, [wins]);
```

Note: `wins` in the dependency array means this callback is stable-but-recreated on each wins change. This matches the existing pattern in `rollForward` which also reads `yesterdayWins`.

### WinCard with toggle prop

```jsx
// WinCard accepts new prop: onToggle
export default function WinCard({ win, onEdit, onDelete, onToggle }) {
  // ... existing state ...
  return (
    <div className="py-6 border-b font-mono group">
      <div className="flex items-start justify-between gap-4">
        {/* Toggle button — always visible, left anchor */}
        <button
          aria-label={win.completed ? 'Mark incomplete' : 'Mark complete'}
          onClick={() => onToggle?.()}
          className="shrink-0 mt-1 text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          {win.completed
            ? <CheckCircle size={16} />
            : <Circle size={16} />}
        </button>

        {/* Title */}
        {isEditing ? (
          <input ... />
        ) : (
          <span className={[
            'flex-1 text-lg leading-snug',
            win.completed ? 'line-through text-muted-foreground' : 'text-foreground',
          ].join(' ')}>
            {win.title}
          </span>
        )}

        {/* Existing edit/delete buttons unchanged */}
        <div className="flex items-center gap-2 mt-0.5">
          ...
        </div>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Completion only via evening check-in | Inline toggle on win card during day | This phase | Users can mark wins done any time |
| DayDetail as flat bordered list | Vertical dot-and-line timeline | This phase | More visual hierarchy, consistent with task management app reference |

**Deprecated/outdated:**
- `WinRow` inside DayDetail.jsx: replaced by `TimelineItem` in this phase. The expand/collapse note pattern can be preserved inside the new component.

## Open Questions

1. **Should the existing `status: 'pending'` column be retired or repurposed?**
   - What we know: `status` is set to `'pending'` on insert and never updated anywhere in the codebase
   - What's unclear: Was it intended to be set to `'completed'` instead of the new boolean `completed` column?
   - Recommendation: Leave `status` column alone (don't touch it) — the new `completed boolean` is the correct addition for this feature. The `status` column can be cleaned up in a future cleanup phase.

2. **Should the TodayPage strikethrough affect the streak/check-in count?**
   - What we know: Streak is computed from `check_ins` joins, not from `wins.completed`
   - What's unclear: Whether the inline toggle should gate the "Check in" button or replace the evening check-in flow
   - Recommendation: Keep them independent in this phase. `wins.completed` is a daytime convenience toggle. The evening `check_ins` flow is the official completion record for streak purposes.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (with @testing-library/react, @testing-library/user-event) |
| Config file | vitest.config.js |
| Quick run command | `mise exec -- bun run test --run` |
| Full suite command | `mise exec -- bun run test --run` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| WIN-INT-01 | toggleWinCompleted flips boolean and calls Supabase update | unit | `mise exec -- bun run test --run src/hooks/useWins.test.js` | Wave 0 |
| WIN-INT-02 | toggleWinCompleted rolls back on Supabase error | unit | `mise exec -- bun run test --run src/hooks/useWins.test.js` | Wave 0 |
| WIN-INT-03 | WinCard renders line-through when win.completed is true | unit | `mise exec -- bun run test --run src/components/wins/WinCard.test.jsx` | Exists (extend) |
| WIN-INT-04 | WinCard toggle button click calls onToggle | unit | `mise exec -- bun run test --run src/components/wins/WinCard.test.jsx` | Exists (extend) |
| TIMELINE-01 | DayDetail renders timeline items with dots and left-border cards | unit | `mise exec -- bun run test --run src/components/history/DayDetail.test.jsx` | Exists (extend) |
| TIMELINE-02 | TimelineItem shows strikethrough + filled dot for completed win | unit | `mise exec -- bun run test --run src/components/history/DayDetail.test.jsx` | Exists (extend) |
| TIMELINE-03 | TimelineItem shows normal text + hollow dot for incomplete win | unit | `mise exec -- bun run test --run src/components/history/DayDetail.test.jsx` | Exists (extend) |

### Sampling Rate
- **Per task commit:** `mise exec -- bun run test --run`
- **Per wave merge:** `mise exec -- bun run test --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useWins.test.js` — covers WIN-INT-01, WIN-INT-02 (add toggleWinCompleted test cases; file likely exists from Phase 2 — needs new test blocks)
- [ ] DB migration `supabase/migrations/003_add_completed_to_wins.sql` — required before any Supabase integration runs

*(Existing test files for WinCard and DayDetail need new test cases added, not created from scratch.)*

## Sources

### Primary (HIGH confidence)
- Direct codebase reading: `src/hooks/useWins.js`, `src/components/wins/WinCard.jsx`, `src/components/wins/WinList.jsx`, `src/pages/TodayPage.jsx`, `src/pages/HistoryPage.jsx`, `src/components/history/DayDetail.jsx` — verified current implementation patterns
- `.planning/STATE.md` — established codebase decisions (optimistic update pattern, Supabase query shapes, Tailwind v4 usage, motion/react import)

### Secondary (MEDIUM confidence)
- Tailwind v4 `line-through` utility — standard Tailwind text-decoration class, consistent with project's Tailwind v4 usage
- CSS `border-l` vertical timeline — standard CSS pattern, no library verification needed

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, verified by reading source files
- Architecture: HIGH — patterns derived directly from existing codebase conventions
- Pitfalls: HIGH — derived from reading actual code shapes and established decisions in STATE.md
- DB migration: HIGH — migration pattern used in 002 for timer column drops

**Research date:** 2026-03-13
**Valid until:** 2026-06-13 (stable stack — 90 days)
