# Phase 5: Journal Rich Text & Mobile — Research

**Researched:** 2026-03-18
**Domain:** Tiptap rich text editor, mobile-responsive layout, dayStartHour bug fixes
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Rich Text Editor**
- Tiptap StarterKit for bold, italic, bullet/numbered lists, headings (H2, H3)
- THREE discovery methods: slash commands (type "/" for menu like Notion), markdown shortcuts (auto-convert **bold**, ## heading, - list), AND keyboard shortcuts (Cmd+B, Cmd+I)
- No visible toolbar — formatting is discoverable through slash menu and keyboard
- Existing plain-text entries render as paragraphs (line breaks become `<p>` tags)
- Keep word count display (use Tiptap character-count extension)
- Content stored as HTML in Supabase with `body_format` column for migration safety

**Mobile Navigation**
- Bottom tab bar with 5 items: Today, Journal, Finance, Settings, Lock
- Theme toggle moves to Settings page on mobile
- Finance barrel navigation works the same on mobile with touch swipe
- Finance cards stack vertically on mobile (single column)
- Breakpoint: `sm` (640px) — only phones get mobile layout, tablets keep desktop

**DayStrip + Night Owl Fixes**
- dayStartHour offset applies to: win date attribution, streak calculation (journal entries before boundary count toward previous day's streak), DayStrip "today", heatmap cell dates, rollover logic
- dayStartHour does NOT affect: journal recorded date (always actual calendar date), finance (calendar months)
- DayStrip centers on the "logical today" (offset-aware): at 2:30 AM with dayStartHour=3, "today" is yesterday
- Heatmap: days with no wins show as empty cells (0 count, border only)
- Rollover: must respect dayStartHour — wins completed before the boundary count as that "logical day"'s completions, not rollover candidates

**Layout Consistency**
- Universal max-w-[1000px] centered container for ALL pages (Today, Journal, Settings, Finance)
- Settings page: tabbed sections (General, Notifications, Income, Security) — reduces scroll, organized
- Mobile: no card borders/backgrounds — just content with dividers (iOS settings style)
- Mobile: full-width content with consistent padding
- Desktop: constrained content widths, no edge-to-edge stretching

**Journal Count Summary**
- Per-month entry count visible on Finance/Year overview
- Total for the year in the year overview summary stats row

### Claude's Discretion
- Tiptap extension configuration and slash command menu design
- Bottom tab bar exact sizing and safe-area handling
- DayStrip centering algorithm for mobile touch
- Tab component for Settings sections
- How journal count integrates into existing year overview RPC

### Deferred Ideas (OUT OF SCOPE)
- Income source add/edit with Wise offramp-style conversion UI
- Biometric auth (WebAuthn) — v2.1
- External balances (Polymarket, SOL DCA) — v2.1
- Journal entry tagging/search — not in current scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JRNL-01 | User can format journal entries with bold, italic, bullet lists, numbered lists, and headings (H2, H3) | Tiptap StarterKit provides all; keyboard shortcuts via Tiptap command API |
| JRNL-02 | Formatting via keyboard shortcuts only (Cmd+B, Cmd+I, etc.) — no visible toolbar | Tiptap built-in keyboard maps via StarterKit; markdown shortcuts via input rules |
| JRNL-03 | Existing plain-text entries render correctly after migration (backward compatible) | `body_format` column + format-aware render path in JournalEntryCard |
| JRNL-04 | Journal content stored as HTML in Supabase with `body_format` column | Migration SQL: `ALTER TABLE journal_entries ADD COLUMN body_format text DEFAULT 'plaintext'` |
| JRNL-05 | Journal count summary — per-month entry count on Finance/Year overview and total for the year | Extend `get_year_overview` RPC or add separate query in `useYearOverview` |
| MOB-01 | All pages usable on iPhone 15 Pro Max viewport (430px width) | Tailwind `sm:` breakpoint; audit all fixed px values |
| MOB-02 | SideNav collapses to bottom tab bar on mobile widths | SideNav: add `hidden sm:flex` desktop variant + `sm:hidden` bottom bar variant |
| MOB-03 | Touch targets minimum 44x44px on all interactive elements | Audit: DayStrip cells, NavLink icons, WinCard checkboxes, all buttons |
| MOB-04 | No horizontal scroll on any page at mobile widths | Remove fixed widths; use `w-full` and responsive padding |
| MOB-05 | Finance pages responsive with stacked layout on mobile | Finance grid → `flex-col sm:flex-row` pattern |
| MOB-06 | DayStrip centers the current/selected day with carousel scrolling | `scrollIntoView` on selected cell on mount and selection change |
| MOB-07 | Fix DayStrip/header date mismatch when dayStartHour offset is active | DayStrip generates dates with `getLocalDateString(d, dayStartHour)` but then calls `onSelectDate(dateStr)` where dateStr already has offset applied — TodayPage also applies offset. Off-by-one in rendering vs selection |
| MOB-08 | Fix consistency heatmap NaN wins count | `totalCompleted += cell.entry.completed` where `cell.entry` can be `boolean` — needs null/type guard |
| MOB-09 | Fix rollover prompting for already-completed wins | `yesterdayWins` in useWins fetches all wins for yesterday including completed ones; rollover prompt should exclude already-completed wins |
| MOB-10 | Layout consistency audit — constrain all page content widths | `max-w-[1000px] mx-auto` applied to all page roots |
</phase_requirements>

---

## Summary

This phase has three distinct workstreams: Tiptap rich text editor integration, mobile responsiveness, and dayStartHour bug fixes. All three are technically independent of each other and can be planned in parallel waves.

The Tiptap integration replaces the existing `<textarea>` in `JournalEditorOverlay.tsx` with `<EditorContent>`. The package is already well-documented and fits the project's pattern (headless, TypeScript, React 19 compatible). The main complexity is the slash command menu — Tiptap's official slash command extension is experimental and unpublished; it must be hand-rolled using `@tiptap/suggestion`. This is medium complexity but well-trodden in the community.

The mobile work is pure CSS/layout: SideNav becomes a bottom tab bar below `sm:` (640px), `AppShell` gains a `pb-16 sm:pb-0` bottom padding, and every page gets `max-w-[1000px] mx-auto`. Safe-area insets for the iPhone home indicator are handled with CSS `env(safe-area-inset-bottom)` via an inline style or a custom Tailwind utility.

The bug fixes are surgical: the DayStrip date mismatch is a day label vs. `dateStr` misalignment, the heatmap NaN is a type guard missing in `totalCompleted` accumulation, and the rollover bug is that `yesterdayWins` includes completed wins that should be filtered before showing the prompt.

**Primary recommendation:** Implement in order — (1) dayStartHour bug fixes (unblocks correct behavior everywhere), (2) Tiptap + schema migration, (3) mobile layout, (4) layout consistency audit + journal count.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tiptap/react` | ^3.20 | React bindings + `useEditor` hook | Already recommended in STACK.md; React 19 compatible |
| `@tiptap/pm` | ^3.20 | ProseMirror peer dependency | Required by @tiptap/react |
| `@tiptap/starter-kit` | ^3.20 | Bold, Italic, BulletList, OrderedList, Heading, HardBreak, History, + markdown input rules | All JRNL-01 requirements in one install |
| `@tiptap/extension-character-count` | ^3.20 | `editor.storage.characterCount.words()` | Replaces manual `wordCount()` fn; HTML-aware |
| `@tiptap/extension-placeholder` | ^3.20 | "Write your entry..." placeholder text | Built-in; zero custom CSS needed |
| `@tiptap/suggestion` | ^3.20 | Suggestion plugin used to build slash command menu | Required peer for custom slash extension |

### No New Dependencies for Mobile
| Concern | Solution | Why |
|---------|----------|-----|
| Responsive breakpoints | Tailwind v4 `sm:` utilities (existing) | 640px breakpoint = phones only |
| Safe-area insets | `env(safe-area-inset-bottom)` CSS (native) | No library needed |
| Touch scrolling | CSS `overflow-x: auto; scroll-snap-type: x mandatory` (existing in DayStrip) | Already in place |

**Installation (new packages only):**
```bash
bun add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-character-count @tiptap/extension-placeholder @tiptap/suggestion
```

Note: `typescript` is already in devDependencies (`^5.9.3`). No TypeScript changes needed.

### Tiptap v3 vs v2 Note
Tiptap v3 (current) added `Link` and `Underline` to StarterKit by default. The StarterKit also includes markdown input rules natively — `**bold**`, `_italic_`, `# Heading`, `- list` auto-convert on type. No separate `@tiptap/extension-input-rules` package needed.

**Confidence:** HIGH — verified via official Tiptap docs and npm current version

---

## Architecture Patterns

### Pattern 1: Tiptap Editor Replacement in JournalEditorOverlay

**What:** Replace `<textarea>` with `<EditorContent editor={editor} />`. The `useEditor` hook manages all state.

**Critical constraint:** The `<EditorContent>` must be in a **static (non-animated)** container. The outer overlay can animate via CSS keyframes (existing pattern), but the `motion.div` wrapping editor content must NOT have `y`, `x`, or `scale` properties — ProseMirror cursor calculations break when a parent has CSS `translate` applied. This is the exact collision documented in PITFALLS.md.

**Integration with existing state machine pattern:**
```tsx
// JournalEditorOverlay.tsx — swap textarea for Tiptap
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Placeholder } from '@tiptap/extension-placeholder';

const editor = useEditor({
  extensions: [
    StarterKit,
    CharacterCount,
    Placeholder.configure({ placeholder: 'Write your entry...' }),
    SlashCommand, // custom extension — see Pattern 2
  ],
  content: parseBodyForTiptap(initialBody, bodyFormat), // format-aware
  shouldRerenderOnTransaction: false, // performance: no parent re-render on keystroke
  onUpdate: ({ editor }) => {
    bodyRef.current = editor.getHTML(); // save as HTML
    const wc = editor.storage.characterCount.words();
    setLiveWordCount(wc);
    liveWordCountRef.current = wc;
  },
});

// Replace:
// <textarea value={body} onChange={handleBodyChange} ... />
// With:
<EditorContent
  editor={editor}
  className="flex-1 w-full tiptap-editor outline-none"
/>
```

**Save call unchanged:** `onSave({ title, body: bodyRef.current, category })` — `bodyRef` is updated via `onUpdate`.

### Pattern 2: Slash Command Menu (Custom Extension)

**What:** Tiptap's official slash command extension is experimental and unpublished. Must build using `@tiptap/suggestion` (the same plugin used by the Mention extension).

**Recommended approach:** Build a headless `SlashCommand` extension that:
1. Triggers on `/` character
2. Shows a minimal floating `<ul>` rendered via React portal (matches Nothing aesthetic: monospace text labels, no icons, monochrome)
3. Filters commands as user types after `/`
4. Dismisses on Escape or blur

**Commands to support:**
| Slash Command | Action |
|---------------|--------|
| `/h2` or `/heading2` | Insert H2 heading |
| `/h3` or `/heading3` | Insert H3 heading |
| `/bullet` or `/ul` | Insert bullet list |
| `/numbered` or `/ol` | Insert numbered list |
| `/bold` | Toggle bold |
| `/italic` | Toggle italic |

**Extension skeleton:**
```tsx
// src/components/journal/SlashCommand.ts
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export const SlashCommand = Extension.create({
  name: 'slashCommand',
  addOptions() {
    return { suggestion: { char: '/', command: ({ editor, range, props }) => {
      props.command({ editor, range });
    }}};
  },
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })];
  },
});
```

The floating menu is a React component passed into `suggestion.render()` — it receives `props.items` (filtered commands) and `props.command` (executes selected).

**Why hand-roll vs third-party library:** `@harshtalks/slash-tiptap` and `@bmin-mit/tiptap-slash-commands` exist but add bundle weight and design constraints. For a monochrome Nothing-aesthetic menu, a custom 80-line extension + 60-line menu component is cleaner than a styled third-party solution.

### Pattern 3: Plain-Text Migration

**What:** Existing `journal_entries.body` contains plain strings. New entries store HTML. The `body_format` column distinguishes them.

**Database migration:**
```sql
-- 014_journal_body_format.sql
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS body_format text NOT NULL DEFAULT 'plaintext';

-- Existing rows keep 'plaintext' default — no data transform needed
```

**Format-aware render (JournalEntryCard):**
```tsx
// Display: render HTML for tiptap entries, text for plaintext
function renderBody(body: string, format: string) {
  if (format === 'html') {
    // dangerouslySetInnerHTML is safe — single user, no untrusted input
    return <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: body }} />;
  }
  // Plaintext: preserve line breaks
  return <p className="whitespace-pre-wrap">{body}</p>;
}
```

**Format-aware editor init (JournalEditorOverlay):**
```tsx
function parseBodyForTiptap(body: string, format: string): string {
  if (format === 'html' || body.startsWith('<')) return body;
  // Plain text: wrap in paragraph (Tiptap expects HTML)
  // Split on double newlines for paragraphs
  if (!body.trim()) return '';
  return body
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}
```

**On save:** Always save as `body_format: 'html'` going forward (Tiptap outputs HTML via `editor.getHTML()`). First edit of a plaintext entry upgrades it.

**`onSave` signature update:**
```tsx
interface JournalEditorOverlayProps {
  onSave: (entry: { title: string; body: string; body_format: string; category: string }) => Promise<void>;
  // ...
}
// In handleSave:
await onSave({ title: currentTitle, body: bodyRef.current, body_format: 'html', category });
```

### Pattern 4: Mobile Bottom Tab Bar

**What:** SideNav renders differently below `sm:` (640px). Desktop: left column `w-14`. Mobile: fixed bottom bar `h-14`, full width.

**AppShell change (minimal):**
```tsx
// AppShell.tsx — add bottom padding on mobile for tab bar clearance
<main className="ml-0 sm:ml-14 flex-1 overflow-y-auto pb-16 sm:pb-0">
  <Outlet />
</main>
```

**SideNav restructure:**
```tsx
// SideNav.tsx — hidden mobile bottom bar (completely separate render path)

// Desktop: existing left nav (add hidden sm:flex)
<nav className="hidden sm:flex fixed left-0 top-0 bottom-0 w-14 flex-col ...">
  {/* existing desktop content */}
</nav>

// Mobile: bottom tab bar (sm:hidden)
<nav
  className="sm:hidden fixed bottom-0 left-0 right-0 z-10
             flex items-center justify-around
             border-t border-border bg-background
             h-14"
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
>
  {TABS.map(({ to, icon: Icon, label, end }) => (
    <NavLink key={to} to={to} end={end} className={...}>
      <Icon className="size-5" />
      <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
    </NavLink>
  ))}
  {/* Lock button replaces ThemeToggle slot */}
  <button onClick={...}><Lock /></button>
</nav>
```

**Safe area inset:** Bottom nav uses `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` inline. On iOS PWA the indicator is ~34px; on browser it's 0. No library needed.

**Lock button on mobile:** The Lock item IS one of the 5 tabs per the decision. `ThemeToggle` moves to SettingsPage on mobile — conditionally render it there with `sm:hidden`.

### Pattern 5: DayStrip Mobile Centering (MOB-06)

**What:** On mount and when `selectedDate` changes, scroll the DayStrip so the selected cell is centered.

**Current behavior:** DayStrip scrolls to rightmost on mount (`el.scrollLeft = el.scrollWidth`). Does not scroll on external `selectedDate` changes.

**Fix pattern:**
```tsx
// Add ref to each cell, scroll selected into view
useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;
  // Find the cell for selectedDate and scroll it into center
  const selectedCell = el.querySelector(`[aria-label="${selectedDate}"]`) as HTMLElement;
  if (selectedCell) {
    const cellCenter = selectedCell.offsetLeft + selectedCell.offsetWidth / 2;
    el.scrollLeft = cellCenter - el.clientWidth / 2;
  } else {
    el.scrollLeft = el.scrollWidth; // fallback to rightmost
  }
}, [selectedDate]);
```

### Pattern 6: DayStrip Date Mismatch Bug Fix (MOB-07)

**Root cause (confirmed from code analysis):** DayStrip generates `dateStr = getLocalDateString(d, dayStartHour)` where `d` is `new Date(today); d.setDate(d.getDate() - i)` — `today` is the real calendar date `new Date()`. The `dayAbbr` and `dateNum` (display labels) are derived from `d` (the real calendar date), but `dateStr` is the offset-adjusted date.

At 2:30 AM with `dayStartHour=3`, `getLocalDateString(new Date(), 3)` returns yesterday's date (correct — 2:30 AM hasn't crossed the 3 AM boundary yet). So the rightmost cell shows `dateStr = yesterday` but `dayAbbr/dateNum = today`. The header shows yesterday's label but the strip shows today's number.

**Fix:** When generating cells, derive BOTH display label and dateStr from the same offset-aware base date. The logical today is `getLocalDateString(new Date(), dayStartHour)`. Build cells backward from that logical today:

```tsx
// DayStrip.tsx — correct cell generation
const logicalToday = getLocalDateString(new Date(), dayStartHour); // e.g., "2026-03-16" at 2:30AM with dsh=3

const cells = [];
for (let i = days - 1; i >= 0; i--) {
  // Parse logicalToday as a Date, offset back by i days
  const [y, m, d] = logicalToday.split('-').map(Number);
  const base = new Date(y, m - 1, d); // Local date at midnight
  base.setDate(base.getDate() - i);
  const dateStr = new Intl.DateTimeFormat('en-CA').format(base); // YYYY-MM-DD
  const dayAbbr = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(base);
  const dateNum = base.getDate();
  cells.push({ date: dateStr, dayAbbr, dateNum, completed: !!completionMap[dateStr] });
}
```

This ensures labels and dateStr always agree — both based on logical dates, not calendar dates.

### Pattern 7: Heatmap NaN Bug Fix (MOB-08)

**Root cause (confirmed from code analysis):** In `ConsistencyGraph.tsx` lines 98-101:
```tsx
let totalCompleted = 0;
for (const cell of cells) {
  if (cell.entry) totalCompleted += typeof cell.entry === 'boolean' ? 1 : cell.entry.completed;
}
```
When `cell.entry` is a `CompletionEntry` object (`{ completed: number, total: number }`), `cell.entry.completed` can be `undefined` if the completionMap was constructed with malformed data (boolean `true` entries being passed where `CompletionEntry` is expected, or dayStartHour misalignment producing keys that don't match any data).

The `typeof cell.entry === 'boolean'` guard handles the boolean case, but if `cell.entry.completed` is `undefined` (malformed entry), `undefined + number = NaN`.

**Fix:** Add explicit number coercion:
```tsx
if (cell.entry) {
  if (typeof cell.entry === 'boolean') {
    totalCompleted += cell.entry ? 1 : 0;
  } else {
    totalCompleted += Number(cell.entry.completed) || 0;
  }
}
```

Also ensure the dayStartHour offset-aware date lookup in ConsistencyGraph uses the same `getLocalDateString` pattern as DayStrip after the MOB-07 fix.

### Pattern 8: Rollover Bug Fix (MOB-09)

**Root cause (confirmed from code analysis):** `useWins.ts` fetches `yesterdayWins` as all wins from yesterday (including completed ones). The `RollForwardPrompt` receives all of them. The rollover prompt should only offer wins that are NOT yet completed — because completed wins don't need to roll forward.

**Fix in useWins:**
```tsx
// In the yesterdayResult query:
supabase
  .from('wins')
  .select('title, id, category')
  .eq('win_date', yesterday)
  .eq('user_id', USER_ID)
  .eq('completed', false)  // ADD THIS FILTER
```

This ensures only incomplete yesterday wins appear in the rollover prompt.

**Secondary constraint:** `yesterday` in useWins must also respect dayStartHour. At 2:30 AM with dayStartHour=3, "yesterday" in logical terms is the calendar day before the offset-adjusted today. The current code is:
```tsx
const yd = new Date();
yd.setDate(yd.getDate() - 1);
const yesterday = getLocalDateString(yd, dayStartHour);
```
This is actually correct — `getLocalDateString(yd, dayStartHour)` with `dayStartHour=3` at 2:30 AM on calendar Tuesday will return Monday's date (same as "today" logical would return Monday). Wait — this creates an issue: at 2:30 AM (before boundary), both `today` and `yesterday` resolve to offset-adjusted values. `today` = Monday, `yesterday` = Sunday. That is correct — the "yesterday" for a night owl is the day before their logical today.

The real fix is just the `.eq('completed', false)` filter.

### Pattern 9: Settings Page Tab Refactor

**What:** SettingsPage currently scrolls through all sections. Decision: group into 4 tabs: General, Notifications, Income, Security.

**Tab implementation:** Use shadcn `Tabs` (already available via shadcn/ui) with `TabsList`, `TabsTrigger`, `TabsContent`.

```tsx
// SettingsPage.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="general">
  <TabsList className="font-mono text-xs uppercase tracking-widest w-full justify-start border-b border-border rounded-none bg-transparent gap-0 px-6">
    {['General', 'Notifications', 'Income', 'Security'].map(tab => (
      <TabsTrigger key={tab} value={tab.toLowerCase()}
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent pb-2"
      >
        {tab}
      </TabsTrigger>
    ))}
  </TabsList>
  <TabsContent value="general">...</TabsContent>
  {/* etc */}
</Tabs>
```

**Mobile variant:** On mobile, tabs stay as horizontal row — they already work at 640px widths. No special mobile treatment needed beyond the existing `overflow-x-auto` on TabsList if labels overflow.

### Pattern 10: Journal Count in Year Overview (JRNL-05)

**What:** Add per-month journal entry count to `get_year_overview` RPC result and display in YearOverviewPage summary row.

**Approach A (extend RPC — preferred):** Add a LEFT JOIN to `journal_entries` grouped by month in the `get_year_overview` SQL function. Returns `journal_count` per month alongside existing finance data.

```sql
-- In get_year_overview function, add to SELECT:
COUNT(DISTINCT je.id) AS journal_count
-- LEFT JOIN:
LEFT JOIN journal_entries je
  ON je.user_id = p_user_id
  AND to_char(je.created_at AT TIME ZONE 'UTC', 'YYYY-MM') = ms.month
```

**Approach B (separate query):** `useYearOverview` makes a second query to `journal_entries` grouped by month. Simpler to implement without touching SQL, but two round trips.

**Recommendation:** Approach A if touching the RPC migration is acceptable. Approach B if minimizing Supabase SQL changes is preferred for speed. Given the RPC already exists and a new migration is needed anyway (014 for body_format), extend the RPC in the same migration.

**MonthSummary type addition:**
```tsx
// src/types/finance.ts
interface MonthSummary {
  // ... existing fields
  journal_count: number; // new
}
```

**Display location:** YearOverviewPage summary row gets a 5th stat tile: "Journal Entries: {total}". YearGrid month cells could show the count as a small badge. Keep minimal — just a number, no icon.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bold, italic, lists, headings | Custom contenteditable | Tiptap StarterKit | ProseMirror handles cursor, undo/redo, selection, copy/paste edge cases |
| Word count from HTML | Manual string parsing | `@tiptap/extension-character-count` | `wordCount(editor.getHTML())` miscounts — CharacterCount works on the document model |
| Markdown auto-conversion | Custom regex replace | StarterKit input rules | Built into StarterKit — `**text**` auto-converts on space |
| Safe-area padding calculation | JS viewport measurement | CSS `env(safe-area-inset-bottom)` | Native CSS, no JS, updates on orientation change automatically |
| Breakpoint detection | `window.matchMedia` React hook | Tailwind `sm:` utility classes | CSS-only, no re-renders, no hydration issues |

---

## Common Pitfalls

### Pitfall 1: Tiptap + motion/react CSS Translate Collision
**What goes wrong:** If `<EditorContent>` lives inside a `motion.div` with `y` or `x` animations, ProseMirror cursor positions calculate against the pre-transform element position. Clicking in text lands cursor in the wrong place.
**Why it happens:** motion v12 uses CSS `translate` property (not `transform`). ProseMirror doesn't account for parent CSS translate transforms.
**How to avoid:** Keep `<EditorContent>` in a static container. Animate the overlay wrapper with CSS keyframes (existing `journal-overlay-enter`/`journal-overlay-exit` pattern) or opacity only. The `motion.div` inside the editing screen (line 110-116 of current JournalEditorOverlay) uses `opacity` and `y: -8` on exit — `y` on exit is fine if the editor is unmounting, but `y` on the container during ENTRY must be avoided.
**Warning signs:** Cursor appears above/below the click point after the overlay animates in.

### Pitfall 2: Tiptap shouldRerenderOnTransaction Default
**What goes wrong:** Every keystroke triggers a ProseMirror transaction, which by default re-renders the React component. With the overlay and Zustand subscriptions, this can compound.
**How to avoid:** `shouldRerenderOnTransaction: false` in `useEditor()`. Read toolbar active state with `useEditorState()` hook (selector-based, not on every transaction).
**Warning signs:** Typing lag in editor, high CPU in profiler during text input.

### Pitfall 3: Slash Command Menu Portal Positioning
**What goes wrong:** Slash command menu rendered inside the overlay's `fixed inset-0` container will position correctly. But if it's portaled to `document.body`, its position coordinates need to be relative to viewport, not the editor.
**How to avoid:** Use Tiptap's `suggestion.decorations` rect (passed as `clientRect` in render props) for positioning. Keep the menu component inside the overlay DOM (no separate portal needed) since the overlay is already `fixed inset-0`.

### Pitfall 4: Plain-Text Body Stored as HTML Without body_format Column
**What goes wrong:** If migration adds `body_format` column AFTER some entries have already been saved as HTML from Tiptap, those entries won't have `body_format = 'html'` and will render incorrectly.
**How to avoid:** Migration runs BEFORE any Tiptap code ships. The column defaults to `'plaintext'` so ALL existing rows (including any future ones while migration deploys) are safe. Tiptap code explicitly sets `body_format: 'html'` on every save.

### Pitfall 5: Bottom Tab Bar Height + Safe-Area = Content Cut Off
**What goes wrong:** The bottom tab bar is `h-14` (56px at 18px base). On iPhone with home indicator, `env(safe-area-inset-bottom)` adds ~34px. The total nav height is ~90px. `AppShell` main area needs `pb-16 sm:pb-0` — but 64px bottom padding may not be enough on iPhone.
**How to avoid:** Use `calc(56px + env(safe-area-inset-bottom))` for the bottom padding on `<main>`. Alternatively, apply `pb-[calc(56px+env(safe-area-inset-bottom))]` but Tailwind v4 arbitrary values support `calc()` expressions.
**Warning signs:** Last items in scrollable pages are hidden behind the tab bar on iPhone.

### Pitfall 6: Finance Page Mobile Overflow
**What goes wrong:** Finance pages have horizontal strip scrollers (MonthStrip) and fixed-width chart containers. These don't reflow on mobile.
**How to avoid:** MonthStrip is already scrollable horizontally — just ensure it doesn't have `min-w` constraints that force overflow. Finance cards: change `grid-cols-2` or `flex-row` to `grid-cols-1 sm:grid-cols-2` or `flex-col sm:flex-row`.

---

## Code Examples

Verified from current codebase + official Tiptap docs:

### Install Tiptap
```bash
bun add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-character-count @tiptap/extension-placeholder @tiptap/suggestion
```

### Tiptap useEditor Setup
```tsx
// Source: https://tiptap.dev/docs/editor/getting-started/install/react
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Placeholder } from '@tiptap/extension-placeholder';

const editor = useEditor({
  extensions: [
    StarterKit,
    CharacterCount,
    Placeholder.configure({ placeholder: 'Write your entry...' }),
  ],
  content: initialHTML,
  shouldRerenderOnTransaction: false,
  onUpdate: ({ editor }) => {
    bodyRef.current = editor.getHTML();
    setLiveWordCount(editor.storage.characterCount.words());
  },
});
```

### Tiptap Keyboard Shortcut Chains
```tsx
// These are built into StarterKit — no custom code needed
// Cmd+B → bold, Cmd+I → italic, Cmd+Z → undo
// Tab in list → indent, Shift+Tab → outdent
// StarterKit also adds markdown input rules:
//   ** → bold, _ → italic, # → H1, ## → H2, ### → H3, - → bullet
```

### Tiptap CSS Scoping (Tailwind v4)
```css
/* src/index.css — scope Tiptap editor styles */
.tiptap-editor .ProseMirror {
  outline: none;
  min-height: 200px;
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--muted-foreground);
  opacity: 0.3;
  float: left;
  height: 0;
  pointer-events: none;
}

/* Heading styles matching Nothing aesthetic */
.tiptap-editor h2 { font-size: 1.4rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.tiptap-editor h3 { font-size: 1.15rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
.tiptap-editor ul, .tiptap-editor ol { padding-left: 1.5rem; }
.tiptap-editor li { margin: 0.2rem 0; }

/* Do NOT use @tailwindcss/typography prose classes — they conflict with Tiptap inline styles */
```

### Bottom Tab Bar Safe Area
```tsx
// SideNav.tsx — mobile bottom nav
<nav
  className="sm:hidden fixed bottom-0 left-0 right-0 z-10
             flex items-center justify-around border-t border-border bg-background"
  style={{
    height: 'calc(3.5rem + env(safe-area-inset-bottom))',
    paddingBottom: 'env(safe-area-inset-bottom)',
  }}
>
```

### AppShell Mobile Clearance
```tsx
// AppShell.tsx
<main className="ml-0 sm:ml-14 flex-1 overflow-y-auto"
  style={{ paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
  // sm: override via Tailwind
>
  {/* Add className="sm:pb-0" won't override inline style — use conditional */}
</main>
```

Better pattern — use a CSS variable or CSS class:
```css
/* index.css */
@layer base {
  .mobile-bottom-clearance {
    padding-bottom: calc(3.5rem + env(safe-area-inset-bottom));
  }
  @media (min-width: 640px) {
    .mobile-bottom-clearance { padding-bottom: 0; }
  }
}
```

### Database Migration for body_format
```sql
-- supabase/migrations/014_journal_body_format.sql
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS body_format text NOT NULL DEFAULT 'plaintext';

-- No data migration needed — existing rows get 'plaintext' default
-- New entries saved by Tiptap will explicitly set 'html'
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `body` as `text` (plaintext only) | `body` as HTML with `body_format` discriminator | Backward compatible; no data loss |
| Manual word count from textarea value | `editor.storage.characterCount.words()` | Accurate through HTML; handles punctuation |
| Left SideNav, desktop-only | Responsive: left SideNav (≥640px) + bottom tab bar (<640px) | Mobile-usable without layout changes |
| `el.scrollLeft = el.scrollWidth` (rightmost) | `scrollIntoView` centered on selected cell | Correct selected day visibility |

**Deprecated in this phase:**
- `body_format` column not existing (all entries assumed plaintext) → explicit format tracking
- `wordCount(textarea.value)` helper function → replaced by CharacterCount extension

---

## Open Questions

1. **Tiptap content format — HTML vs JSON**
   - What we know: PITFALLS.md says "always store JSON, never HTML." CONTEXT.md says "stored as HTML."
   - What's unclear: The CONTEXT.md decision wins (it is locked). The concern is round-trip reliability. Tiptap's `getHTML()` → `setContent(html)` round-trip is reliable for the extensions in StarterKit.
   - Recommendation: Honor CONTEXT.md — store HTML. The pitfall about JSON vs HTML applies to complex custom nodes; StarterKit-only HTML round-trips cleanly.

2. **get_year_overview RPC modification**
   - What we know: The RPC exists in `013_phase4_rpcs.sql`. Adding journal count requires a new migration.
   - What's unclear: Whether to modify the RPC body (Approach A) or add a second client-side query (Approach B).
   - Recommendation: Migration 014 modifies the RPC to add journal count. Single query, cleaner. Include DROP FUNCTION IF EXISTS + CREATE OR REPLACE FUNCTION pattern.

3. **ThemeToggle on mobile**
   - What we know: It moves to SettingsPage on mobile per CONTEXT.md decision.
   - What's unclear: Whether to conditionally render it in both places (hidden on mobile in SideNav, visible in Settings) or remove from SideNav entirely on mobile.
   - Recommendation: `<ThemeToggle className="hidden sm:flex" />` in SideNav (removes from mobile bottom bar). In SettingsPage, render `<div className="sm:hidden">...</div>` wrapping a ThemeToggle with label. This avoids duplicate rendering on desktop.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + @testing-library/react |
| Config file | `vite.config.ts` (test block) |
| Quick run command | `bun run test --run` |
| Full suite command | `bun run test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JRNL-01 | Tiptap editor renders; bold/italic/list/heading work | unit | `bun run test --run src/components/journal/JournalEditorOverlay.test.tsx` | ✅ (needs update) |
| JRNL-02 | Keyboard shortcuts apply formatting | manual | Keyboard test on real device — jsdom can't simulate Cmd+B reliably | — |
| JRNL-03 | Plaintext entries render with whitespace-pre-wrap | unit | `bun run test --run src/components/journal/JournalEntryCard.test.tsx` | ✅ (needs update) |
| JRNL-04 | body_format column: insert sets 'html', read returns format | integration/manual | Manual Supabase check + app smoke test | — |
| JRNL-05 | Year overview shows journal count | unit | `bun run test --run src/hooks/useYearOverview.test.ts` | ❌ Wave 0 |
| MOB-01 | No overflow at 430px | manual | Chrome DevTools responsive + real iPhone | — |
| MOB-02 | Bottom tab bar renders < sm:, SideNav hidden | unit | `bun run test --run src/components/layout/SideNav.test.tsx` | ✅ (needs update) |
| MOB-03 | Interactive elements have min 44x44px hit areas | manual | Visual audit + Chrome accessibility tree | — |
| MOB-04 | No horizontal scroll at 430px | manual | Chrome DevTools responsive | — |
| MOB-05 | Finance stacks vertically | manual | Chrome DevTools responsive | — |
| MOB-06 | DayStrip centers selected day | unit | `bun run test --run src/components/history/DayStrip.test.tsx` | ✅ (needs update) |
| MOB-07 | DayStrip date/header alignment with dayStartHour | unit | `bun run test --run src/components/history/DayStrip.test.tsx` | ✅ (needs update) |
| MOB-08 | Heatmap shows no NaN; completionMap type guard | unit | `bun run test --run src/components/history/ConsistencyGraph.test.tsx` | ✅ (needs update) |
| MOB-09 | Rollover prompt excludes completed wins | unit | `bun run test --run src/hooks/useWins.test.ts` | ✅ (needs update) |
| MOB-10 | All pages have max-w-[1000px] constraint | manual | Visual audit at 1440px | — |

### Sampling Rate
- **Per task commit:** `bun run test --run src/components/journal/ src/components/history/ src/hooks/useWins.test.ts`
- **Per wave merge:** `bun run test --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useYearOverview.test.ts` — covers JRNL-05 (journal count in year overview)
- [ ] Update `src/components/journal/JournalEditorOverlay.test.tsx` — mock `useEditor` from `@tiptap/react` (jsdom doesn't support ProseMirror DOM APIs natively)
- [ ] Update `src/components/journal/JournalEntryCard.test.tsx` — add test for `body_format='plaintext'` vs `'html'` render path

**Tiptap + jsdom note:** `useEditor` will throw in jsdom because ProseMirror uses `document.createRange()` which jsdom supports, but some DOMRect operations may fail. Pattern: mock `@tiptap/react` in unit tests — export a minimal `editor` stub with `getHTML()`, `storage.characterCount.words()`, and `isActive()`. The existing `JournalEditorOverlay.test.tsx` already mocks Supabase; extend the same pattern for Tiptap.

---

## Sources

### Primary (HIGH confidence)
- `src/components/journal/JournalEditorOverlay.tsx` — existing overlay pattern, state machine
- `src/components/layout/SideNav.tsx` — existing nav structure
- `src/components/layout/AppShell.tsx` — existing layout
- `src/components/history/DayStrip.tsx` — confirmed date generation bug
- `src/components/history/ConsistencyGraph.tsx` — confirmed NaN bug location
- `src/hooks/useWins.ts` — confirmed rollover bug (no `.eq('completed', false)` filter)
- `src/lib/utils/date.ts` — `getLocalDateString` implementation
- `.planning/research/STACK.md` — Tiptap package recommendations
- `.planning/research/PITFALLS.md` — Tiptap+motion collision, migration pitfalls
- [Tiptap React Install Docs](https://tiptap.dev/docs/editor/getting-started/install/react)
- [Tiptap StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit)
- [Tiptap CharacterCount](https://tiptap.dev/docs/editor/extensions/functionality/character-count)
- [MDN env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)

### Secondary (MEDIUM confidence)
- [Tiptap Slash Commands (experimental)](https://tiptap.dev/docs/examples/experiments/slash-commands) — confirmed unpublished; must custom build
- [Tiptap Suggestion](https://tiptap.dev/docs/editor/extensions/nodes/mention) — confirmed pattern for slash trigger using `@tiptap/suggestion`
- Multiple sources confirm `env(safe-area-inset-bottom)` is ~34px on iOS PWA

### Tertiary (LOW confidence)
- Community pattern for `@harshtalks/slash-tiptap` as third-party alternative (reviewed, not recommended for this project)

---

## Metadata

**Confidence breakdown:**
- Tiptap integration: HIGH — package is stable, patterns verified in docs and prior STACK.md research
- Slash command implementation: MEDIUM — must be custom-built; pattern is clear but requires implementation work
- Mobile layout: HIGH — pure Tailwind CSS, no unknowns
- Bug fixes: HIGH — root causes confirmed by direct code analysis in DayStrip.tsx, ConsistencyGraph.tsx, useWins.ts
- Journal count: MEDIUM — RPC modification approach is clear; exact SQL depends on existing function signature

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30 days — Tiptap updates frequently but API is stable within v3.x)
