---
phase: 01-foundation
plan: "05"
subsystem: ui
tags: [react, tailwind, design-system, dark-mode, geist-mono]

# Dependency graph
requires:
  - phase: 01-foundation/01-04
    provides: useTheme hook, dark mode toggle, localStorage persistence

provides:
  - Visual acceptance of Phase 1 foundation confirmed
  - Dot grid background visible in both light and dark modes
  - Flash-free dark mode with inline backgroundColor on <html> before CSS loads
  - Geist Mono Variable as both --font-sans and --font-mono tokens

affects:
  - Phase 2 feature work (can proceed on confirmed visual foundation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dot grid applied as .dot-grid class on AppShell root div (not body) so background-image layers with bg-background on same element
    - Flash prevention: inline script sets both classList and backgroundColor so page paints correct dark/light color before Vite CSS module injects
    - Both --font-sans and --font-mono Tailwind tokens point to same Geist Mono Variable for consistent monospaced design system

key-files:
  created: []
  modified:
    - src/index.css
    - index.html
    - src/components/layout/AppShell.jsx

key-decisions:
  - "Dot grid moved from body to .dot-grid utility class on AppShell root — AppShell's bg-background painted over body background-image"
  - "Flash prevention script sets document.documentElement.style.backgroundColor directly so dark bg renders before Vite injects CSS modules"
  - "--font-mono added to @theme inline pointing to Geist Mono Variable — font-mono Tailwind class now resolves to Geist Mono, not browser default mono stack"

patterns-established:
  - "Background texture: apply background-image and background-color on the same element to prevent occlusion"
  - "Flash prevention: set inline style backgroundColor in addition to class so pre-CSS paint is correct color"

requirements-completed:
  - SHELL-01
  - SHELL-02

# Metrics
duration: 15min
completed: 2026-03-09
---

# Phase 1 Plan 05: Visual Acceptance Summary

**Dot grid, flash prevention, and Geist Mono font token fixes that gate Phase 2 feature work**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-09T21:30:00Z
- **Completed:** 2026-03-09T21:45:00Z
- **Tasks:** 2 (Task 1 complete in prior session; Task 2 fixed and accepted here)
- **Files modified:** 3

## Accomplishments

- Dot grid background now renders in both light and dark modes — moved `.dot-grid` background-image from body to AppShell root div so it coexists with `bg-background` on the same element
- No white flash on hard refresh in dark mode — inline script now sets `document.documentElement.style.backgroundColor` directly, painting the correct bg color before Vite's CSS module loads
- Geist Mono Variable confirmed as global primary font — `--font-mono` token added to `@theme inline` so both `font-sans` and `font-mono` Tailwind classes resolve to Geist Mono

## Task Commits

1. **Task 1: Run full test suite and dev server** - (prior session, all 6 tests pass)
2. **Task 2: Visual acceptance + three-issue fix** - `c067616` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/index.css` - Replaced body background-image with .dot-grid utility class; added .dark .dot-grid variant; added --font-mono token to @theme inline
- `index.html` - Flash-prevention script now sets backgroundColor inline on <html> element
- `src/components/layout/AppShell.jsx` - Added dot-grid class to root div

## Decisions Made

- `.dot-grid` utility class on AppShell root div is the correct pattern for texture that must layer with a Tailwind bg-* class — never split background-color and background-image across parent/child elements
- Flash prevention in Vite requires setting inline style in addition to class because CSS is injected by JS modules (not a <link> tag), so it's unavailable until after React hydrates

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dot grid invisible because background-image applied to body while AppShell root div painted over it with bg-background**
- **Found during:** Task 2 (visual acceptance)
- **Issue:** `body` had `background-image` set but AppShell root div had `bg-background` (solid color), completely covering the texture
- **Fix:** Moved texture to `.dot-grid` utility class applied directly to the AppShell root div; both background-color and background-image now live on the same element
- **Files modified:** `src/index.css`, `src/components/layout/AppShell.jsx`
- **Verification:** Dot grid visible in light and dark modes in browser
- **Committed in:** `c067616`

**2. [Rule 1 - Bug] White flash on hard refresh in dark mode — inline script set class but not backgroundColor**
- **Found during:** Task 2 (visual acceptance)
- **Issue:** Vite injects CSS via JS module, not a synchronous `<link>` tag; the `.dark { --background: ... }` CSS variable isn't available until after module hydration, leaving a white flash between page parse and CSS injection
- **Fix:** Added `document.documentElement.style.backgroundColor = 'oklch(0.145 0 0)'` (dark) or `'oklch(1 0 0)'` (light) inline in the flash-prevention script so correct bg color paints before CSS loads
- **Files modified:** `index.html`
- **Verification:** Hard refresh in dark mode shows no white flash
- **Committed in:** `c067616`

**3. [Rule 1 - Bug] font-mono Tailwind class mapped to browser default mono stack, not Geist Mono**
- **Found during:** Task 2 (visual acceptance — DevTools check)
- **Issue:** `--font-mono` was not defined in `@theme inline`; Tailwind used its built-in default mono stack (ui-monospace, SFMono-Regular, etc.) for `font-mono` class
- **Fix:** Added `--font-mono: 'Geist Mono Variable', monospace` to `@theme inline` block
- **Files modified:** `src/index.css`
- **Verification:** `font-mono` class now resolves to Geist Mono Variable in DevTools Computed styles
- **Committed in:** `c067616`

---

**Total deviations:** 3 auto-fixed (Rule 1 bugs — all visual rendering issues discovered at visual acceptance gate)
**Impact on plan:** All three fixes necessary for plan success criteria. No scope creep.

## Issues Encountered

None beyond the three auto-fixed bugs above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 foundation complete: routing, design system, dark mode toggle, Geist Mono font, dot grid texture all confirmed
- 6/6 automated tests passing
- Ready to begin Phase 2 (Win Logging and Focus Tracking)

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
