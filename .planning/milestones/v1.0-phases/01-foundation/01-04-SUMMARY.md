---
phase: 01-foundation
plan: "04"
subsystem: ui
tags: [react, tailwind, dark-mode, fonts, design-system, vitest]

requires:
  - phase: 01-01
    provides: Vitest test scaffold with jsdom environment and @testing-library/react

provides:
  - useTheme hook with localStorage persistence and .dark class toggling on documentElement
  - ThemeToggle component (shadcn Button + Sun/Moon Lucide icons)
  - Flash-free dark mode via inline script in index.html <head>
  - Geist Mono Variable as global font (--font-sans in @theme inline)
  - Dot grid background in both light and dark modes (radial-gradient, 24px, fixed)
  - --radius tightened to 0.25rem (Nothing Phone precision design)
  - matchMedia stub in test-setup.js for jsdom compatibility

affects:
  - 01-03-shell (ThemeToggle ready to mount in Header.jsx)
  - All feature phases (design tokens are the primitives they use)

tech-stack:
  added:
    - "@fontsource-variable/geist-mono"
    - "src/test-setup.js (jsdom matchMedia stub)"
  patterns:
    - "Flash-free dark mode: inline IIFE in <head> reads localStorage + matchMedia, sets .dark on <html> before React hydrates"
    - "useTheme reads initial state from documentElement.classList (set by inline script), no flicker"
    - "Tailwind v4 dark mode via @custom-variant dark (&:is(.dark *)) — .dark class on <html>"

key-files:
  created:
    - src/hooks/useTheme.js
    - src/components/theme/ThemeToggle.jsx
    - src/test-setup.js
  modified:
    - src/index.css
    - index.html
    - vitest.config.js
    - package.json

key-decisions:
  - "localStorage key is 'wintrack-theme' — shared contract between inline script and useTheme hook"
  - "useTheme reads initial state from classList (set by inline script) not localStorage, preventing re-read flash"
  - "matchMedia stub defined in test-setup.js (writable property) so vi.spyOn can intercept it in jsdom"

patterns-established:
  - "Pattern: dark mode uses .dark class on <html> set before React mount via inline IIFE"
  - "Pattern: useTheme hook owns post-mount class management; inline script owns pre-mount"
  - "Pattern: vitest jsdom missing browser APIs fixed in test-setup.js, not in individual test files"

requirements-completed:
  - SHELL-01
  - SHELL-02

duration: 3min
completed: 2026-03-09
---

# Phase 1 Plan 04: Design System and Dark Mode Summary

**Geist Mono Variable font, dot grid background, flash-free dark mode toggle hook, and Nothing Phone design tokens (--radius 0.25rem) wired into Tailwind v4**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T13:10:00Z
- **Completed:** 2026-03-09T13:13:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- useTheme hook with localStorage persistence, .dark class toggle, and initial state read from documentElement (set by inline script)
- ThemeToggle component ready to mount in Header.jsx (Plan 03)
- Flash-free dark mode: inline IIFE in index.html `<head>` applies .dark class before React hydrates
- Geist Mono Variable set as global font, --radius tightened to 0.25rem, dot grid background in both modes

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement useTheme hook and ThemeToggle component** - `7039b2e` (feat)
2. **Task 2: Apply design system to index.css and flash-prevention to index.html** - `7ea3c70` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/hooks/useTheme.js` - Theme toggle hook; reads classList for initial state, persists to localStorage
- `src/components/theme/ThemeToggle.jsx` - Ghost icon button switching Sun/Moon on theme state
- `src/test-setup.js` - jsdom matchMedia stub enabling vi.spyOn in useTheme tests
- `src/index.css` - Added Geist Mono import, updated --font-sans, --radius 0.25rem, dot grid on body, .dark body override
- `index.html` - Flash-prevention IIFE before module script, viewport-fit=cover added
- `vitest.config.js` - Wired setupFiles to src/test-setup.js

## Decisions Made

- localStorage key `wintrack-theme` is the shared contract between the inline script and `useTheme` — both must use the same key or FOUC occurs
- useTheme reads initial state from `document.documentElement.classList` (already set by inline script) rather than re-reading localStorage, which avoids a second synchronous read and ensures state matches what's already rendered
- matchMedia stub placed in `test-setup.js` (not individual test files) to keep tests clean and DRY

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.spyOn crash on window.matchMedia in jsdom**
- **Found during:** Task 1 (running useTheme tests)
- **Issue:** jsdom does not define `window.matchMedia`; `vi.spyOn(window, "matchMedia")` throws "vi.spyOn() can only spy on a function. Received undefined."
- **Fix:** Created `src/test-setup.js` with a writable `window.matchMedia` stub, wired it into `vitest.config.js` setupFiles
- **Files modified:** `src/test-setup.js`, `vitest.config.js`
- **Verification:** All 3 useTheme tests pass including the matchMedia spy test
- **Committed in:** `7039b2e` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test environment setup)
**Impact on plan:** Required fix — without it test 3 crashes before assertion. No scope creep.

## Issues Encountered

None beyond the matchMedia jsdom gap (documented above).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ThemeToggle is ready to mount in `Header.jsx` (Plan 03's shell layout)
- Design tokens (font, radius, colors) are set — all feature phases use these primitives without revisiting
- Requirements SHELL-01 (dark mode toggle) and SHELL-02 (Nothing Phone design language) are both closed

---
*Phase: 01-foundation*
*Completed: 2026-03-09*

## Self-Check: PASSED

- FOUND: src/hooks/useTheme.js
- FOUND: src/components/theme/ThemeToggle.jsx
- FOUND: src/test-setup.js
- FOUND: .planning/phases/01-foundation/01-04-SUMMARY.md
- FOUND: commit 7039b2e (Task 1)
- FOUND: commit 7ea3c70 (Task 2)
