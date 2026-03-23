# Stack Research — v2.1 Finance Redesign & UI Rehaul

**Project:** wintrack v2.1
**Researched:** 2026-03-23
**Confidence:** HIGH
**Scope:** NEW dependencies and integration patterns only. Validated base stack (Vite, React 19, Tailwind v4, shadcn/ui Nova preset, Supabase JS, Tiptap v3, Lucide, vite-plugin-pwa, motion/react, Geist Mono, Zustand v5) is unchanged.

---

## Executive Summary

v2.1 needs **zero new npm packages**. Every capability required — collapsible sections, sticky sidebar layout, scrollable panels, and a named accent color — is already available via the installed stack. The work is configuration and component scaffolding, not package installation.

The four new capability areas break down as:

1. **Collapsible month sections** → `bunx shadcn@latest add accordion` (scaffolds a component using already-installed `radix-ui ^1.4.3`)
2. **Single-panel collapse triggers** → `bunx shadcn@latest add collapsible` (same Radix dependency)
3. **Scrollable sidebar panel** → `bunx shadcn@latest add scroll-area` (same Radix dependency, optional — native `overflow-y-auto` may suffice)
4. **`#7CF5A5` accent color** → Add `--color-brand` to the existing `@theme inline` block in `index.css`; update `--accent` / `--primary` CSS variables in `:root` / `.dark` to point to it

No new runtime packages. No schema migrations required beyond adding columns for recurring debt payment tracking.

---

## Recommended Stack Additions

### Core Technologies

No new frameworks or runtimes.

### Supporting Libraries (shadcn component scaffolding only)

These commands scaffold source files into `src/components/ui/` — they do not add new npm dependencies. The underlying Radix primitives are already installed at `radix-ui ^1.4.3`.

| Component | Install Command | Purpose | When to Use |
|-----------|-----------------|---------|-------------|
| Accordion | `bunx shadcn@latest add accordion` | Collapsible stacked sections with keyboard nav and WAI-ARIA | Month sections in the ledger timeline — each month is an AccordionItem; past months collapsed by default |
| Collapsible | `bunx shadcn@latest add collapsible` | Single expand/collapse toggle for a content panel | "Past months" summary block, any standalone expandable card that isn't part of a stack |
| ScrollArea | `bunx shadcn@latest add scroll-area` | Styled cross-browser scrollable container | Fixed-height sidebar that needs a scrollbar with consistent appearance across OS; defer if native `overflow-y-auto` is acceptable |
| Separator | `bunx shadcn@latest add separator` | Semantic horizontal/vertical divider line | Dividing sidebar sections, category dividers in the ledger |

**Why Accordion over a hand-rolled collapsible:**
Radix Accordion handles keyboard navigation (Space/Enter/Arrow keys), WAI-ARIA `aria-expanded`, focus management, and animated height transitions without custom logic. Using `type="multiple"` allows all months open simultaneously; `type="single" collapsible` enforces one-open.

**Why not a heavy timeline library (Mobiscroll, KendoReact):**
These are calendar/scheduler products, not finance ledgers. They bring a large bundle, opinionated styling, and licensing complexity for something that is simply a vertically ordered list of collapsible month sections. Accordion + plain divs is the correct scope for this use case.

### Development Tools

No new dev tools.

---

## CSS Changes: #7CF5A5 Accent Color

### Strategy

The existing `index.css` already defines all color tokens as CSS custom properties in `:root` / `.dark` and maps them into the Tailwind theme via `@theme inline`. Adding `#7CF5A5` requires three edits to `index.css` — no npm changes, no Tailwind config changes.

### The Three Edits

**1. Add named `--brand` token in `:root` (hex → OKLCH conversion)**

`#7CF5A5` converts to approximately `oklch(0.88 0.15 152)` (verified via okcolor.app — a light, vivid green-mint in the P3 gamut). Store the raw value once in `:root` so it can be referenced anywhere:

```css
:root {
  /* ... existing tokens ... */
  --brand: oklch(0.88 0.15 152);
  --brand-foreground: oklch(0.145 0 0); /* near-black text on brand bg */
}
```

In `.dark`, re-declare `--brand` as the same value — this color reads well on dark backgrounds and does not need adjustment:

```css
.dark {
  /* ... existing dark tokens ... */
  --brand: oklch(0.88 0.15 152);
  --brand-foreground: oklch(0.145 0 0);
}
```

**2. Map to Tailwind in `@theme inline`**

The `@theme inline` block already maps every CSS variable to a `--color-*` Tailwind token. Add two lines:

```css
@theme inline {
  /* ... existing mappings ... */
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
}
```

This generates `bg-brand`, `text-brand`, `border-brand`, `fill-brand`, `ring-brand`, and all other Tailwind color utilities automatically.

**3. Redirect shadcn semantic tokens to brand**

shadcn/ui components use `--primary`, `--ring`, and `--accent` for interactive states (button fills, focus rings, hover highlights). To make the accent color app-wide, update the semantic tokens:

```css
:root {
  --primary: oklch(0.88 0.15 152);        /* buttons, active states */
  --primary-foreground: oklch(0.145 0 0); /* text on primary */
  --ring: oklch(0.88 0.15 152);           /* focus rings */
}
.dark {
  --primary: oklch(0.88 0.15 152);
  --primary-foreground: oklch(0.145 0 0);
  --ring: oklch(0.88 0.15 152);
}
```

**Why NOT use `--accent` for this:**
In the Nova preset, `--accent` is used for hover states on non-primary interactive elements (menus, sidebars) and maps to a neutral gray. Overriding it globally would color every hover state green, which is too aggressive. Use `--primary` + `--ring` for the interactive accent; use `bg-brand` / `text-brand` for explicit green placement in custom components.

**Confidence for CSS approach:** HIGH — Tailwind v4 docs confirm `@theme inline` with CSS variable references generates utility classes; project already uses this exact pattern (see `--color-accent: var(--accent)` at line 99 of `index.css`).

---

## Fixed Sidebar Layout

### Strategy

Use CSS Grid at the page level. No new library needed. Tailwind v4 grid utilities handle everything.

```html
<!-- Two-panel desktop / single-column mobile -->
<div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 h-screen overflow-hidden">
  <!-- Main ledger timeline — scrolls independently -->
  <main class="overflow-y-auto">
    <!-- Month accordion sections -->
  </main>

  <!-- Fixed sidebar — scrolls independently, sticks to viewport -->
  <aside class="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
    <!-- Balance, projections, year overview -->
  </aside>
</div>
```

**Key CSS insight:** `position: sticky` only sticks within its scroll container. For a true fixed sidebar that stays put while the main content scrolls, the parent must be `overflow: hidden` (not `overflow: auto`), and each panel gets its own `overflow-y: auto`. This is the `h-screen overflow-hidden` + independent overflow pattern — no library needed.

**Mobile:** Below `lg:` breakpoint, `grid-cols-1` stacks sidebar below the ledger. On mobile, the sidebar collapses to a card at the top or is hidden behind a summary row.

**Confidence:** HIGH — pattern documented in CSS-Tricks, MDN, and multiple shadcn/ui layout examples.

---

## Continuous Ledger Timeline

### Structure

The ledger is a vertically scrolling list of month sections. Each section is a Radix Accordion item.

```
<Accordion type="multiple" defaultValue={[currentMonth]}>
  <AccordionItem value="2026-03">   <!-- Current month, open -->
    <AccordionTrigger>March 2026 — Balance snapshot</AccordionTrigger>
    <AccordionContent>
      [Fixed bills] [Recurring debts] [One-off expenses] [Budget caps]
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="2026-02">   <!-- Past month, closed -->
    ...
  </AccordionItem>
</Accordion>
```

Past months collapse into a read-only summary line (total spent, balance at end of month). `defaultValue={[currentMonth]}` opens only the current month on load.

### Recurring Debt Tracking

Recurring debts require storing flexible payments + remaining balance. This needs a schema addition — not a new package.

**Proposed schema changes:**

```sql
-- New table: debt_entries (replaces the bills table for recurring debts)
CREATE TABLE debt_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  total_amount numeric NOT NULL,
  remaining_balance numeric NOT NULL,
  min_payment numeric,
  created_at timestamptz DEFAULT now()
);

-- New table: debt_payments (payment log per debt per month)
CREATE TABLE debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES debt_entries(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  month text NOT NULL,  -- YYYY-MM
  paid_at timestamptz DEFAULT now()
);

-- New table: budget_logs (spending under a budget cap)
CREATE TABLE budget_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_name text NOT NULL,
  amount numeric NOT NULL,
  description text,
  month text NOT NULL,  -- YYYY-MM
  logged_at timestamptz DEFAULT now()
);
```

The existing `bills` table continues to hold fixed monthly and one-off expenses. Recurring debts get their own tables to support payment history and remaining balance computation.

**Confidence:** MEDIUM — schema design based on standard ledger patterns; exact column set will evolve during implementation. No external library for debt math needed — JavaScript arithmetic is sufficient.

---

## Installation

```bash
# Scaffold shadcn/ui components (no new npm packages installed — uses radix-ui already in dependencies)
bunx shadcn@latest add accordion
bunx shadcn@latest add collapsible
bunx shadcn@latest add scroll-area
bunx shadcn@latest add separator
```

**Total new npm package surface: 0**

All scaffolded components use `radix-ui ^1.4.3` which is already in `package.json`.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Radix Accordion via shadcn | Custom `<details>` / `<summary>` HTML | `<details>` has no controlled state, no smooth animation, and awkward styling. Radix Accordion gives controlled open state, keyboard nav, and CSS height transitions for free. |
| Radix Accordion via shadcn | react-collapse / react-spring | Additional packages when Radix (already installed) covers the use case. Avoid dependency bloat. |
| CSS Grid sticky sidebar | shadcn/ui Sidebar component | shadcn Sidebar is designed for navigation drawers with open/closed state. A finance sidebar is a static data panel — CSS Grid + `position: sticky` is simpler and has no JavaScript overhead. |
| `@theme inline --color-brand` | Tailwind `@utility` directive | `@utility` generates a standalone utility class but does not produce the full `bg-*`/`text-*`/`border-*` family automatically. `@theme inline` with `--color-brand` generates all color utilities from one declaration. |
| `oklch()` for brand color | Raw hex `#7CF5A5` in CSS variable | Tailwind v4 processes all colors through its internal pipeline. Using oklch is consistent with the existing token set and produces correct output with Tailwind's color opacity modifier syntax (`bg-brand/50`). Hex in a CSS variable does NOT support opacity modifiers. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Mobiscroll / KendoReact timeline | Heavyweight calendar/scheduler libraries — massive bundle, opinionated UI, wrong abstraction for a ledger | Radix Accordion + plain month sections |
| `react-query` / TanStack Query | Supabase JS already handles async data fetching; adding a caching layer adds complexity without benefit for a single-user personal app | Existing Zustand + Supabase pattern |
| `decimal.js` / `big.js` | Financial arithmetic with JavaScript `number` is sufficient for personal budgets (amounts < $1M, no fractional cents needed) | Native JS arithmetic with `toFixed(2)` for display |
| `date-fns` | Not needed for YYYY-MM month string manipulation; `new Date()` + `Intl.DateTimeFormat` already handles all date display requirements in this project | Native Date + Intl.DateTimeFormat (already used) |
| shadcn Sidebar component | Designed for collapsible nav drawers, not static data sidebars; adds open/close state management that is not needed here | CSS Grid with `position: sticky` |
| Any new chart library | Finance sidebar projections and year overview can reuse the Recharts-backed shadcn Chart components already scaffolded in v2.0 | Existing `src/components/ui/chart.tsx` |

---

## Version Compatibility

| Package | Version in Use | Compatibility Notes |
|---------|----------------|---------------------|
| `radix-ui` | ^1.4.3 | Accordion, Collapsible, ScrollArea primitives are all included in the monorepo package. `bunx shadcn@latest add` scaffolds against this version. |
| `shadcn` | ^4.0.2 | CLI version that scaffolds into `src/components/ui/`. Confirmed to support accordion, collapsible, scroll-area commands. Style: `radix-nova`. |
| `tailwindcss` | ^4.2.1 | `@theme inline` with `--color-*` variables is a v4-only feature — confirmed working in current project's `index.css`. |
| `motion` | ^12.35.2 | Accordion height animation uses CSS `grid-rows` transition (shadcn default), not motion. No conflict with the known `translate`/`transform` issue. |

---

## Sources

- [shadcn/ui Accordion docs](https://ui.shadcn.com/docs/components/radix/accordion) — component API, install command, type="multiple" support
- [shadcn/ui Collapsible docs](https://ui.shadcn.com/docs/components/radix/collapsible) — single-panel expand/collapse
- [shadcn/ui ScrollArea docs](https://ui.shadcn.com/docs/components/radix/scroll-area) — custom scrollbar container
- [Radix Primitives — Accordion](https://www.radix-ui.com/primitives/docs/components/accordion) — underlying primitive API
- [Tailwind CSS v4.0 — Theme Variables](https://tailwindcss.com/docs/theme) — `@theme inline` color variable mapping
- [Tailwind CSS v4.0 — Colors](https://tailwindcss.com/docs/colors) — oklch format, custom color generation
- [Tailkits — Tailwind v4 Custom Colors](https://tailkits.com/blog/tailwind-v4-custom-colors/) — confirms hex vs oklch behavior in CSS variables
- [CSS Grid sticky sidebar pattern](https://www.paigeniedringhaus.com/blog/use-css-grid-to-make-a-fixed-sidebar-with-scrollable-main-body/) — `h-screen overflow-hidden` + independent overflow technique

---

*Stack research for: wintrack v2.1 Finance Redesign & UI Rehaul*
*Researched: 2026-03-23*
