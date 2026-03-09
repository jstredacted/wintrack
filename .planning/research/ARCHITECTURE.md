# Architecture Research

**Domain:** Personal accountability and focus tracker SPA (single-user, no auth)
**Researched:** 2026-03-09
**Confidence:** HIGH (patterns well-established; schema design from first principles with PostgreSQL best practices)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Pages / Views                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Today   │  │  Journal │  │ History  │  │  Settings    │   │
│  │  (home)  │  │  View    │  │  View    │  │  (theme)     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
├───────┴─────────────┴─────────────┴────────────────┴───────────┤
│                        Feature Modules                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Wins   │  │ Check-in │  │  Timer   │  │   Journal    │   │
│  │  Module  │  │  Module  │  │  Module  │  │   Module     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
├───────┴─────────────┴─────────────┴────────────────┴───────────┤
│                        Shared Layer                             │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  UI Components│  │  DB Client   │  │  Hooks / Utilities   │ │
│  │  (shadcn/ui)  │  │  (Supabase)  │  │  (useTimer, etc.)    │ │
│  └───────────────┘  └──────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     Persistence Layer                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Supabase (PostgreSQL via REST/Realtime)        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `Today` page | Compose the day's view: pending wins, streak, quick-add CTA | Wins module, Check-in module, Timer module |
| `Journal` page | Render and edit today's journal entry; browse past entries | Journal module |
| `History` page | Calendar/list view of past days, completion rates | Wins module (read-only) |
| `Settings` page | Theme toggle (dark/light) | App-level theme state only |
| `Wins` module | Win CRUD, Typeform-style input flow, roll-forward logic | DB client, Timer module (per-win elapsed time) |
| `Check-in` module | Evening review: binary yes/no + reflection note per win | DB client, Wins module (reads today's wins) |
| `Timer` module | Stopwatch per win — start/stop/pause, cumulative display | Local state (running) + DB (persisted elapsed) |
| `Journal` module | Title + body editor, one entry per day | DB client |
| `StepFlow` component | Generic Typeform-style wrapper: step index, transitions, keyboard nav | Used by Wins module only |
| `StreakBadge` component | Reads streak count, renders display | DB client (computed value) |
| `ThemeProvider` | Wraps app, exposes theme context | Settings page |

---

## Recommended Project Structure

```
src/
├── features/
│   ├── wins/
│   │   ├── components/
│   │   │   ├── WinCard.tsx          # Single win display with timer controls
│   │   │   ├── WinList.tsx          # Today's wins list
│   │   │   ├── WinInputFlow.tsx     # Typeform-style multi-step entry
│   │   │   └── RollForwardDialog.tsx
│   │   ├── hooks/
│   │   │   └── useWins.ts           # CRUD queries via Supabase
│   │   └── types.ts
│   ├── checkin/
│   │   ├── components/
│   │   │   ├── CheckInFlow.tsx      # Evening review steps
│   │   │   └── CheckInItem.tsx      # Per-win yes/no + reflection
│   │   ├── hooks/
│   │   │   └── useCheckIn.ts
│   │   └── types.ts
│   ├── timer/
│   │   ├── hooks/
│   │   │   └── useStopwatch.ts      # Core timer logic (local only)
│   │   ├── components/
│   │   │   └── TimerDisplay.tsx
│   │   └── timerPersistence.ts      # Flush elapsed_ms to DB on stop/pause
│   ├── journal/
│   │   ├── components/
│   │   │   ├── JournalEditor.tsx
│   │   │   └── JournalEntry.tsx
│   │   ├── hooks/
│   │   │   └── useJournal.ts
│   │   └── types.ts
│   └── streak/
│       ├── hooks/
│       │   └── useStreak.ts         # Computed from wins table
│       └── StreakBadge.tsx
├── components/
│   ├── ui/                          # shadcn/ui primitives (auto-generated)
│   ├── StepFlow/
│   │   ├── StepFlow.tsx             # Generic step container
│   │   ├── StepTransition.tsx       # Animation wrapper
│   │   └── useStepFlow.ts           # Step index, navigation, keyboard
│   └── layout/
│       ├── AppShell.tsx             # Nav + main content area
│       └── ThemeProvider.tsx
├── lib/
│   ├── supabase.ts                  # Supabase client singleton
│   ├── dates.ts                     # Day boundary helpers (toLocaleDateString, etc.)
│   └── utils.ts                     # cn(), classname helpers (shadcn default)
├── pages/
│   ├── TodayPage.tsx
│   ├── JournalPage.tsx
│   ├── HistoryPage.tsx
│   └── SettingsPage.tsx
├── App.tsx                          # Router, ThemeProvider, global layout
└── main.tsx
```

### Structure Rationale

- **features/**: Each module is a self-contained vertical slice (components + hooks + types). Nothing in `wins/` imports from `checkin/` directly — they communicate through shared DB queries only.
- **components/**: Shared UI that crosses module boundaries. `StepFlow` is generic enough to live here; it knows nothing about wins or check-ins.
- **lib/**: Stateless utilities and the Supabase singleton. No React code here.
- **pages/**: Thin composition layers — they import from features and assemble the view. No business logic.

---

## Supabase Schema

### Table: `wins`

```sql
create table wins (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,                    -- freeform win text
  date        date not null,                    -- the day this win belongs to (local date)
  status      text not null default 'pending',  -- 'pending' | 'complete' | 'incomplete' | 'rolled'
  rolled_from uuid references wins(id),         -- set if this win was rolled from a previous day
  elapsed_ms  integer not null default 0,       -- cumulative timer value in milliseconds
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index wins_date_idx on wins(date);
```

**Design notes:**
- `date` stores the *local* date string (e.g. `2026-03-09`). The app always queries by local date, never by UTC timestamp. Store as `date` type, pass as ISO string from the client.
- `elapsed_ms` is persisted as a plain integer (milliseconds). The running timer is local state; only the accumulated total is written to DB on stop/pause. Avoids frequent writes mid-session.
- `rolled` status distinguishes "explicitly not done, moved forward" from `incomplete` (checked-in as failed). `rolled_from` provides the lineage chain.
- No `user_id` column — single user, no RLS needed.

### Table: `check_ins`

```sql
create table check_ins (
  id          uuid primary key default gen_random_uuid(),
  win_id      uuid not null references wins(id) on delete cascade,
  date        date not null,                    -- the evening this check-in occurred
  completed   boolean not null,                 -- binary yes/no
  reflection  text,                             -- optional note
  created_at  timestamptz not null default now()
);

create unique index check_ins_win_id_date_idx on check_ins(win_id, date);
```

**Design notes:**
- One check-in row per win per day — enforced by unique index.
- `win_id` cascade delete: if a win is deleted, its check-in goes with it.
- `completed` maps directly to the evening flow's yes/no question.
- `reflection` is nullable — the UI prompts for it but does not require it.

### Table: `journal_entries`

```sql
create table journal_entries (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,             -- one entry per day
  title       text,
  body        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

**Design notes:**
- `date` is unique — upsert pattern (`on conflict (date) do update`) keeps the query simple.
- `title` is nullable; the UI can treat an absent title as untitled without a database error.

### Streak Computation

Do not store streak as a column. Compute it client-side from a simple ordered query:

```sql
-- Fetch distinct dates where at least one win was marked complete,
-- ordered descending. Walk forward until gap > 1 day.
select distinct date
from wins
where status = 'complete'
order by date desc;
```

Walk the result in JS: count consecutive days starting from today (or yesterday if today has no complete wins yet). This is simple, always accurate, and avoids a derived-data sync problem. For a single-user app the full result set is tiny.

**Alternative:** A Postgres function/trigger to maintain a `streak_count` integer. Avoid this — it introduces a sync failure mode and adds migration complexity for no real benefit at this scale.

---

## Architectural Patterns

### Pattern 1: Feature Hook — DB Query Ownership

**What:** Each feature owns one hook that encapsulates all Supabase queries for that domain. Components never call `supabase` directly.

**When to use:** Always. This is the baseline boundary.

**Trade-offs:** Minimal indirection for a small app, but pays off immediately when queries need optimistic updates or caching added later.

**Example:**
```typescript
// features/wins/hooks/useWins.ts
export function useWins(date: string) {
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('wins')
      .select('*')
      .eq('date', date)
      .order('created_at')
      .then(({ data }) => {
        setWins(data ?? []);
        setLoading(false);
      });
  }, [date]);

  async function addWin(content: string) {
    const { data } = await supabase
      .from('wins')
      .insert({ content, date, status: 'pending' })
      .select()
      .single();
    if (data) setWins(prev => [...prev, data]);
  }

  return { wins, loading, addWin, /* updateWin, deleteWin, rollWin */ };
}
```

### Pattern 2: Controlled Step Flow (Typeform-style)

**What:** A generic `StepFlow` component manages step index and transition animation. Each step is a child component that receives `onNext` / `onBack`. No routing — purely local state.

**When to use:** Win input flow (4–5 steps), evening check-in flow.

**Trade-offs:** Simpler than URL-based routing for a focused flow; back button is a UI concern, not browser history. Acceptable for an SPA used on one device.

**Example:**
```typescript
// components/StepFlow/useStepFlow.ts
export function useStepFlow(totalSteps: number) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const next = () => {
    setDirection('forward');
    setStep(s => Math.min(s + 1, totalSteps - 1));
  };
  const back = () => {
    setDirection('back');
    setStep(s => Math.max(s - 1, 0));
  };

  return { step, direction, next, back, isFirst: step === 0, isLast: step === totalSteps - 1 };
}
```

Step content accumulates in a `formData` object lifted to the `WinInputFlow` parent. On the final step, one Supabase insert fires. Intermediate state never touches the DB.

### Pattern 3: Stopwatch as Local State, Elapsed as Remote State

**What:** The running timer is 100% local (`useRef` for interval ID, `useState` for display tick). The accumulated `elapsed_ms` is written to Supabase only on pause or stop — not on every tick.

**When to use:** Any in-session timer. Do not persist every 100ms tick.

**Trade-offs:** If the page closes mid-run, the current session's time is lost. Acceptable for a personal tool — add a `beforeunload` flush as a best-effort mitigation.

**Example:**
```typescript
// features/timer/hooks/useStopwatch.ts
export function useStopwatch(initialElapsedMs: number) {
  const [elapsed, setElapsed] = useState(initialElapsedMs);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);      // wall-clock when last started
  const baseElapsedRef = useRef(initialElapsedMs); // elapsed before current session

  const start = () => {
    startTimeRef.current = Date.now();
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(baseElapsedRef.current + (Date.now() - startTimeRef.current));
    }, 100);
  };

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    baseElapsedRef.current = elapsed;
    setRunning(false);
    return elapsed; // caller persists this to DB
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return { elapsed, running, start, pause };
}
```

The `WinCard` component calls `pause()`, receives the elapsed value, and calls `updateWin({ elapsed_ms: value })` from `useWins`.

---

## Data Flow

### Win Creation Flow (Typeform)

```
User opens Add Win
    ↓
WinInputFlow mounts → useStepFlow(4)
    ↓
Step 1: "What's the win?" → local formData.content
Step 2: Confirmation/review → no input
Step N: Submit
    ↓
useWins.addWin(content) → supabase.insert → DB
    ↓
Optimistic update: setWins(prev => [...prev, newWin])
    ↓
Flow dismisses → Today page re-renders win list
```

### Evening Check-In Flow

```
User opens Check-in
    ↓
useCheckIn loads today's wins (reads from wins table)
    ↓
CheckInFlow renders one win per step
    ↓
Each step: binary yes/no → local formData[winId] = { completed, reflection }
    ↓
Final step: submit all
    ↓
Batch upsert to check_ins table (one row per win)
    + update wins.status = 'complete' | 'incomplete' per answer
    ↓
Streak recomputed (useStreak re-fetches wins where status = 'complete')
```

### Timer Flow

```
User taps Start on WinCard
    ↓
useStopwatch.start() → setInterval begins (local only)
    ↓
TimerDisplay reads elapsed every 100ms from local state
    ↓
User taps Pause / Stop
    ↓
useStopwatch.pause() returns final elapsed_ms
    ↓
useWins.updateWin({ id, elapsed_ms }) → supabase.update → DB
```

### State Management Ownership

| State | Owner | Why |
|-------|-------|-----|
| `wins[]` for today | `useWins` hook (local React state, loaded from DB) | Single source; optimistic mutations |
| Timer running/elapsed (active) | `useStopwatch` hook (pure local state) | High-frequency updates; no DB writes mid-session |
| Timer elapsed (persisted) | `wins.elapsed_ms` in DB | Survives page reload |
| Step flow index | `useStepFlow` hook (pure local state) | Ephemeral UI concern |
| Accumulated form data | Parent flow component (`WinInputFlow`, `CheckInFlow`) | Collected before any DB write |
| Theme preference | `ThemeProvider` + `localStorage` | No DB needed; single user |
| Streak count | Computed in `useStreak` on demand | Derived; not stored |

**No global state library needed.** `useContext` for theme only. Everything else is either feature-hook state or local component state.

---

## Suggested Build Order

Dependencies run bottom-up:

```
1. DB schema + Supabase client
        ↓
2. Shared StepFlow component (no DB dependency)
        ↓
3. Wins feature (useWins hook + WinCard + WinList)
        ↓
4. Today page (assembles wins list, add CTA)
        ↓
5. Timer feature (useStopwatch + TimerDisplay, integrates into WinCard)
        ↓
6. Check-in feature (depends on wins existing)
        ↓
7. Journal feature (standalone; no cross-module dependencies)
        ↓
8. Streak badge (depends on wins.status data existing)
        ↓
9. History page (read-only view; depends on all data existing)
        ↓
10. Settings page + ThemeProvider (last; purely cosmetic)
```

**Rationale:** Wins are the core domain object. Timer, check-in, and streak all read/write win records. Build the wins foundation before layering dependent features. Journal and Settings are fully independent and can slot in at any phase.

---

## Anti-Patterns

### Anti-Pattern 1: Per-Tick DB Writes for Timer

**What people do:** Call `supabase.update` inside the `setInterval` callback to keep elapsed time "live" in the DB.

**Why it's wrong:** At 100ms intervals, that is 10 writes/second. Supabase free tier rate limits at ~50 req/s across all operations. Page jitter, quota hits, and wasted compute.

**Do this instead:** Accumulate elapsed in local state. Write to DB only on pause, stop, or page unload (`beforeunload` event as best-effort flush).

### Anti-Pattern 2: Routing Each Step of a Flow

**What people do:** Give each Typeform step its own URL (e.g. `/add-win/step/2`), using React Router params for step state.

**Why it's wrong:** Browser back button exits the flow unexpectedly, form data lives in URL/location state (fragile), and animation between URL transitions requires extra coordination.

**Do this instead:** Keep step index in local state (`useStepFlow`). If deep-linking into a flow matters later (it won't for a single-user personal tool), add it then.

### Anti-Pattern 3: Computed Streak in DB Column

**What people do:** Maintain a `current_streak` column on a `user_stats` table, updated via trigger whenever a win is completed.

**Why it's wrong:** Trigger logic is hard to test, breaks silently on data corrections, and the derived value gets out of sync. For a single user with at most a few hundred win rows, computing streak from the wins table on read is instant.

**Do this instead:** Query `select distinct date from wins where status = 'complete' order by date desc` and compute in JS. Cache the result in React state; recompute when wins change.

### Anti-Pattern 4: Global State for Module Data

**What people do:** Put `wins`, `journalEntry`, and `checkIn` data in a single Zustand or Context store because "it might be needed elsewhere."

**Why it's wrong:** Creates invisible coupling between features. Debugging state mutations becomes hard. Refactoring one module affects every consumer.

**Do this instead:** Each feature hook owns its data. Pass only what a child component needs via props. If two features genuinely share data (e.g., check-in reads today's wins), the downstream feature fetches it independently with the same query — Supabase's connection pool and Postgres query cache absorb the duplication easily.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase (PostgreSQL) | `@supabase/supabase-js` REST client; anon key only | No RLS needed (single user, no auth). Store anon key in `.env` (`VITE_SUPABASE_ANON_KEY`). Public project URL is safe to expose. |
| Vercel | Static SPA deploy (`vite build` → `dist/`) | No SSR. `vercel.json` not required — auto-detects Vite. Add `VITE_SUPABASE_*` env vars in Vercel dashboard. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `wins` module ↔ `timer` module | `WinCard` composes `TimerDisplay`; receives `elapsed_ms` from DB via `useWins`, hands it to `useStopwatch` as initial value | Timer does not import from wins; wins owns the persisted value |
| `wins` module ↔ `checkin` module | Check-in reads today's wins via its own `useCheckIn` query; updates `wins.status` via direct Supabase call | No direct import between modules; both touch the same DB rows |
| `checkin` module ↔ `streak` module | After check-in submit, `useStreak` is re-queried (trigger via React key or explicit `refetch`) | Streak reacts to DB state, not to check-in module events |
| Pages ↔ feature hooks | Pages import from features and compose; features never import from pages | One-directional dependency |

---

## Scaling Considerations

This is a single-user personal tool deployed to Vercel. Traditional scaling tiers are irrelevant. What matters instead:

| Concern | Approach |
|---------|----------|
| Data volume over time | Wins table grows ~5-10 rows/day. At 3 years of use: ~10,000 rows. Trivial for Postgres. |
| History page performance | Paginate or limit to last 90 days by default. A full table scan of 10k rows is still <10ms. |
| Timer accuracy | `setInterval` drifts slightly. Use wall-clock delta (`Date.now() - startTime`) not increment-by-100ms. This is already reflected in the pattern above. |
| Offline resilience | Not a requirement. If Supabase is unreachable, show an error state. Don't implement local queue. |

---

## Sources

- React state management split recommendation: [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025)
- Stopwatch pattern with wall-clock delta: [Implementing a stopwatch using React](https://www.frontendgeek.com/blogs/implementing-stopwatch-using-react-frontend-machine-coding) and [Making setInterval Declarative with React Hooks](https://overreacted.io/making-setinterval-declarative-with-react-hooks/)
- Multi-step wizard architecture: [How to build a smart multi-step form in React](https://medium.com/doctolib/how-to-build-a-smart-multi-step-form-in-react-359469c32bbe)
- Feature-based folder structure: [Feature-Sliced Design](https://feature-sliced.design/), [React Folder Structure in 5 Steps](https://www.robinwieruch.de/react-folder-structure/)
- Optimistic updates with Supabase: [Building Scalable Real-Time Systems with Supabase](https://medium.com/@ansh91627/building-scalable-real-time-systems-a-deep-dive-into-supabase-realtime-architecture-and-eccb01852f2b)
- Supabase schema design: [Schema Design with Supabase: Partitioning and Normalization](https://dev.to/pipipi-dev/schema-design-with-supabase-partitioning-and-normalization-4b7i)

---
*Architecture research for: wintrack — personal accountability and focus tracker SPA*
*Researched: 2026-03-09*
