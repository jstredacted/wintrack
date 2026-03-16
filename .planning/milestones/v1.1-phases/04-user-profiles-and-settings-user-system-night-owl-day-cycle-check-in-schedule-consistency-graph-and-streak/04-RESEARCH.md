# Phase 4: User Profiles and Settings - Research

**Researched:** 2026-03-14
**Domain:** User settings persistence, day-boundary logic, check-in scheduling, contribution heatmap
**Confidence:** HIGH

## Summary

Phase 4 introduces a user settings system, a "night owl" day-cycle offset (shifting the day boundary from midnight to a configurable hour like 4am), configurable check-in schedule times, and a GitHub-style consistency/contribution heatmap. The existing codebase uses a hardcoded `USER_ID` from env vars with no user_settings table. All time-sensitive logic (streak calculation, win_date assignment, morning/evening prompts) currently uses midnight as the day boundary via `getLocalDateString()` and hardcoded hours (9am morning, 9pm evening).

The core technical challenge is the **night owl day cycle**: `getLocalDateString()` is called in 8+ files to determine "today" and must respect a configurable offset. The streak hook, useWins, useHistory, DayStrip, and prompt visibility logic all depend on what "today" means. A settings table in Supabase with client-side caching (Zustand + localStorage) is the cleanest approach.

**Primary recommendation:** Create a `user_settings` Supabase table with a single row per user, build a `useSettings` hook that loads/caches settings, modify `getLocalDateString` to accept an optional hour offset, and thread that offset through all date-dependent code paths. Build the settings page as a new route. Build the consistency heatmap as a standalone component using the existing `completionMap` data pattern from `useHistory`.

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS | ^2.98.0 | Settings persistence | Already used for all data |
| Zustand | ^5.0.11 | Settings state + cache | Already used for UI state |
| React Router | ^7.13.1 | Settings page route | Already used for routing |
| Lucide React | ^0.577.0 | Settings page icons | Already used throughout |

### Supporting (no new dependencies needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage | browser API | Settings cache for instant load | Avoid flash on reload |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase table | localStorage only | No persistence across devices/browsers; fine for single-user but breaks if user clears storage |
| Zustand persist middleware | Manual localStorage read/write | Persist middleware adds complexity; manual pattern already established in uiStore |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  hooks/
    useSettings.js          # Fetch/update user_settings, cache in Zustand + localStorage
  stores/
    settingsStore.js        # Zustand store for settings (dayStartHour, morningPromptHour, eveningPromptHour)
  lib/utils/
    date.js                 # Extend getLocalDateString with offset-aware variant
  pages/
    SettingsPage.jsx        # New route: /settings
  components/
    settings/
      SettingsForm.jsx      # Form fields for all settings
    history/
      ConsistencyGraph.jsx  # GitHub-style heatmap (12-week grid)
supabase/migrations/
    005_add_user_settings.sql
```

### Pattern 1: Settings Table (Single Row per User)
**What:** A `user_settings` table with one row per user, columns for each setting with sensible defaults.
**When to use:** Single-user app with server-side persistence.
**Example:**
```sql
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY,
  day_start_hour integer NOT NULL DEFAULT 0
    CHECK (day_start_hour >= 0 AND day_start_hour <= 6),
  morning_prompt_hour integer NOT NULL DEFAULT 9
    CHECK (morning_prompt_hour >= 5 AND morning_prompt_hour <= 14),
  evening_prompt_hour integer NOT NULL DEFAULT 21
    CHECK (evening_prompt_hour >= 17 AND evening_prompt_hour <= 23),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Pattern 2: Night Owl Day Boundary
**What:** Shift "today" backwards when the current time is before `dayStartHour`.
**When to use:** Users who work past midnight want their late-night wins counted as "today" not "tomorrow."
**Example:**
```javascript
// Enhanced getLocalDateString with night-owl offset
export function getLocalDateString(date = new Date(), dayStartHour = 0) {
  if (dayStartHour > 0) {
    const adjusted = new Date(date.getTime());
    if (adjusted.getHours() < dayStartHour) {
      // Before day boundary — still count as previous day
      adjusted.setTime(adjusted.getTime() - dayStartHour * 3600000);
    }
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(adjusted);
  }
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}
```

### Pattern 3: Settings Store with localStorage Cache
**What:** Zustand store initialized from localStorage, synced to Supabase on change.
**When to use:** Settings need to be available synchronously on page load (no flash/layout shift).
**Example:**
```javascript
import { create } from 'zustand';

const SETTINGS_KEY = 'wintrack-settings';

function readCache() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export const useSettingsStore = create((set) => ({
  settings: readCache() ?? { dayStartHour: 0, morningPromptHour: 9, eveningPromptHour: 21 },
  loaded: !!readCache(),
  setSettings: (s) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    set({ settings: s, loaded: true });
  },
}));
```

### Pattern 4: Consistency Heatmap (GitHub-style)
**What:** A 7-row x N-column grid where each cell represents a day, colored by completion status.
**When to use:** Visual representation of daily consistency over weeks/months.
**Example:**
```jsx
// 12-week (84-day) grid, 7 rows (Mon-Sun), columns = weeks
// Uses completionMap from useHistory (already fetches all win dates + completed status)
// Cell colors: bg-foreground for completed, bg-border for empty, bg-foreground/30 for partial
```

### Anti-Patterns to Avoid
- **Passing dayStartHour as prop through every component:** Use a Zustand store or React context so date utilities can read it directly.
- **Modifying getLocalDateString signature everywhere immediately:** Instead, have the function read from the settings store internally, or create a wrapper `getEffectiveDate()` that components call.
- **Storing settings only in localStorage:** Breaks if user clears browser data. Supabase row is source of truth, localStorage is cache.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic | Manual hour/day math with raw timestamps | `new Date()` with `setTime()` offset | DST edge cases, month boundaries |
| Form state management | Complex useState per field | Single settings object in Zustand | Already established pattern |
| Settings migration | Manual localStorage cleanup | Default values in DB + CHECK constraints | DB constraints catch invalid values |

**Key insight:** The night owl offset is deceptively simple but touches every date-dependent code path. The offset must be applied consistently in: `getLocalDateString`, `useStreak` cursor logic, `useWins` today/yesterday calculation, `useHistory` completionMap, `DayStrip` cell generation, and prompt visibility checks.

## Common Pitfalls

### Pitfall 1: Inconsistent Day Boundary Application
**What goes wrong:** Some code paths use the offset, others don't, leading to wins appearing on wrong days.
**Why it happens:** `getLocalDateString()` is called in 8+ places; easy to miss one.
**How to avoid:** Make the offset built into `getLocalDateString` by having it read from the settings store (or accept it as a parameter with a default from the store). Grep for ALL `getLocalDateString` call sites and verify each one.
**Warning signs:** Wins logged at 1am showing as "tomorrow" when night owl mode is on.

### Pitfall 2: Streak Calculation with Day Offset
**What goes wrong:** Streak cursor walks backward by exactly 86400000ms, but with a day offset the "day" doesn't align with calendar midnight.
**Why it happens:** The streak loop in `useStreak` uses `new Date(cursor.getTime() - 86400000)` which is correct for walking back calendar days, but `getLocalDateString(cursor)` must apply the offset to the cursor too.
**How to avoid:** The offset only affects which calendar date a timestamp maps to. Walking back 86400000ms is still correct for stepping through days. Just ensure `getLocalDateString` applies the offset to the cursor.
**Warning signs:** Streak breaks or double-counts around the day boundary hour.

### Pitfall 3: Settings Not Available on First Render
**What goes wrong:** `useSettings` hook returns defaults while Supabase fetch is in-flight; components flash or compute wrong dates.
**Why it happens:** Async fetch on mount.
**How to avoid:** Cache settings in localStorage. On mount, read localStorage (synchronous), then fetch from Supabase to verify/update. The Zustand store initializes from localStorage so first render has correct values.
**Warning signs:** Brief flash of midnight-based dates before switching to offset dates.

### Pitfall 4: Heatmap Cell Click vs DayStrip Navigation
**What goes wrong:** Two components (heatmap and DayStrip) both allow date selection, creating confusing dual navigation.
**Why it happens:** HistoryPage already has DayStrip; adding a heatmap creates overlap.
**How to avoid:** The consistency heatmap should live on the Settings page or a dedicated stats section, NOT replace DayStrip on HistoryPage. Or: heatmap is read-only (no click navigation), purely visual.
**Warning signs:** User confused about which date navigator to use.

### Pitfall 5: DST Transitions
**What goes wrong:** Subtracting 86400000ms doesn't always equal "yesterday" during DST spring-forward (23-hour day) or fall-back (25-hour day).
**Why it happens:** JavaScript Date math with milliseconds.
**How to avoid:** For date walking, use `date.setDate(date.getDate() - 1)` instead of subtracting milliseconds. This handles DST correctly.
**Warning signs:** Streak breaks or skips a day around DST transitions (March/November in US).

## Code Examples

### Current getLocalDateString Call Sites (must all respect offset)
```
src/lib/utils/date.js          — definition
src/hooks/useStreak.js          — streak cursor walking (3 while loops)
src/hooks/useWins.js            — today/yesterday calculation
src/hooks/useHistory.js         — (indirectly via win_date comparison)
src/stores/uiStore.js           — dismiss date tracking
src/pages/TodayPage.jsx         — const today = getLocalDateString()
src/pages/HistoryPage.jsx       — initial selectedDate
src/components/history/DayStrip.jsx — cell date generation
```

### Settings Upsert Pattern
```javascript
// Supabase upsert for user_settings (single row per user)
async function saveSettings(settings) {
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: USER_ID,
      ...settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  return { error };
}
```

### Consistency Heatmap Data Shape
```javascript
// Reuse completionMap from useHistory: { [YYYY-MM-DD]: boolean }
// Build 84-day grid (12 weeks):
const cells = [];
const today = new Date();
for (let i = 83; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const dateStr = getLocalDateString(d, dayStartHour);
  const weekday = d.getDay(); // 0=Sun..6=Sat
  cells.push({ date: dateStr, weekday, completed: completionMap[dateStr] === true });
}
// Render as CSS grid: grid-template-rows: repeat(7, 1fr)
```

### Settings Page Route Addition
```javascript
// In App.jsx — add settings route
{ path: "settings", Component: SettingsPage },
// In SideNav.jsx — add Settings icon (lucide Settings or Sliders)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Heatmap component | DayStrip replaced Heatmap in v1.0 Phase 5 | 2026-03-10 | Old Heatmap.jsx deleted; need fresh implementation for consistency graph |
| Hardcoded 9am/9pm | Still hardcoded in TodayPage | Current | Must be replaced with settings-driven values |
| Midnight day boundary | Still midnight via getLocalDateString | Current | Must add offset support |

**Deprecated/outdated:**
- Heatmap.jsx + Heatmap.test.jsx: Deleted in v1.0 cleanup. New ConsistencyGraph component needed from scratch.

## Open Questions

1. **Where should the consistency heatmap live?**
   - What we know: DayStrip is on HistoryPage; heatmap serves a different purpose (long-term consistency view).
   - What's unclear: Should it be on Settings page, a new Stats page, or the History page alongside DayStrip?
   - Recommendation: Put it on the Settings page under a "Consistency" section. Keeps History page clean and gives Settings page more substance.

2. **Should the night owl offset also affect notification times in Phase 5?**
   - What we know: Phase 5 is push notifications; Phase 6 removes check-in entirely.
   - What's unclear: Whether the day offset and prompt schedule are truly independent concerns.
   - Recommendation: Keep them independent. dayStartHour shifts "today"; prompt hours are absolute clock times.

3. **Should settings upsert on first app load if no row exists?**
   - What we know: Single user, row may not exist on first visit.
   - Recommendation: Yes. useSettings should upsert defaults on mount if no row found. This ensures the DB always has a row to read.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + jsdom |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

Since requirements are TBD, mapping based on phase description features:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETTINGS-01 | User settings persist to Supabase | unit | `npx vitest run src/hooks/useSettings.test.js -x` | No - Wave 0 |
| SETTINGS-02 | Settings load from localStorage cache on mount | unit | `npx vitest run src/stores/settingsStore.test.js -x` | No - Wave 0 |
| NIGHTOWL-01 | getLocalDateString respects dayStartHour offset | unit | `npx vitest run src/lib/utils/date.test.js -x` | Yes (needs new tests) |
| NIGHTOWL-02 | useStreak calculates correctly with day offset | unit | `npx vitest run src/hooks/useStreak.test.js -x` | Yes (needs new tests) |
| NIGHTOWL-03 | useWins fetches correct "today" with day offset | unit | `npx vitest run src/hooks/useWins.test.js -x` | No - Wave 0 |
| SCHEDULE-01 | Morning/evening prompt hours use settings values | unit | `npx vitest run src/pages/TodayPage.test.jsx -x` | Yes (needs new tests) |
| HEATMAP-01 | ConsistencyGraph renders correct cell count and colors | unit | `npx vitest run src/components/history/ConsistencyGraph.test.jsx -x` | No - Wave 0 |
| SETTINGSUI-01 | SettingsPage renders form and saves on submit | unit | `npx vitest run src/pages/SettingsPage.test.jsx -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useSettings.test.js` -- covers SETTINGS-01
- [ ] `src/stores/settingsStore.test.js` -- covers SETTINGS-02
- [ ] `src/components/history/ConsistencyGraph.test.jsx` -- covers HEATMAP-01
- [ ] `src/pages/SettingsPage.test.jsx` -- covers SETTINGSUI-01
- [ ] Extend `src/lib/utils/date.test.js` with offset tests -- covers NIGHTOWL-01

## Sources

### Primary (HIGH confidence)
- Project source code: `src/hooks/useStreak.js`, `src/lib/utils/date.js`, `src/stores/uiStore.js`, `src/lib/env.js`, `src/lib/supabase.js`
- Supabase migrations: `001_initial_schema.sql` through `004_add_category_to_wins.sql`
- Project state: `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`

### Secondary (MEDIUM confidence)
- Existing patterns from v1.0 phases (Heatmap was built then replaced, documented in STATE.md decisions)

### Tertiary (LOW confidence)
- None. All findings based on direct codebase analysis.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all patterns established in codebase
- Architecture: HIGH - direct extension of existing patterns (Zustand store, Supabase table, hooks)
- Pitfalls: HIGH - identified through direct code analysis of affected call sites
- Night owl logic: MEDIUM - the DST edge case and interaction with streak calculation needs careful implementation

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable domain, no external dependency changes expected)
