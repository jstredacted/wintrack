# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Daily Discipline Loop

**Shipped:** 2026-03-11
**Phases:** 7 | **Plans:** 34 | **Timeline:** 2 days (Mar 9-11 2026)

### What Was Built
- Full daily discipline loop: declare wins → focus timer → evening check-in → journal → combined streak
- Three full-screen overlays: WinInputOverlay (Typeform-style), TimerFocusOverlay (Apple-style bento stopwatch), JournalEditorOverlay (Bear-like immersive editor)
- Streak tracking with StreakCelebration animation — combined win+journal requirement per day
- History & Journal: DayStrip timeline, DayDetail with animations, JournalEntryCard editorial style
- Nothing Phone design language: dot grid, monospaced type, oklch colors, black/white palette
- Full-app polish: tactile press feedback (active:scale) on every interactive element, AnimatePresence transitions throughout

### What Worked
- GSD parallel wave execution — Phase 6 ran 6 agents simultaneously, completing 8 plans in a single wave without conflicts
- TDD RED stubs first (Wave 0) — writing failing tests before implementation caught contract mismatches early (WinCard onEdit signature, JournalEntryCard editingId vs isEditing)
- State-machine animation pattern (visible/exiting useState + onAnimationEnd to unmount) — once established in Phase 6, applied consistently across all overlays
- Wall-clock timestamps for timer — survived background tabs, page refreshes, and mid-session recovery without drift

### What Was Inefficient
- tw-animate-css / motion v12 conflict required multiple iterations before discovering the root cause (CSS `translate` property vs `transform: translate3d()` keyframe conflict); should have audited animation library compatibility at project start
- Phase 5 checkpoint approved informally without formal SUMMARY.md or VERIFICATION.md artifacts — required a dedicated Phase 7 cleanup plan to close the documentation gap
- Supabase mock builder pattern (thenable chainable mock) took significant debugging to get right — a reusable mock factory would have saved time across phases

### Patterns Established
- State-machine overlay pattern: `visible/exiting` useState + `onAnimationEnd` to unmount — use for all future overlay/modal components
- Wave 0 RED stubs: write all test files with module-not-found failures before any implementation — catches API contracts early
- Wall-clock timestamps for any running-state UI — never use setInterval for elapsed time display
- `Intl.DateTimeFormat('en-CA')` for local date strings — never `.toISOString().slice(0,10)`

### Key Lessons
1. Animation library compatibility must be verified at project start — tw-animate-css and motion v12 have a silent conflict that wastes multiple debugging cycles
2. Checkpoint plans need a formal SUMMARY.md even when approved informally — informal approval without artifacts creates audit debt requiring a cleanup phase
3. Push notification scope must be explicitly tiered in requirements (v1 stub vs v2 delivery) — ambiguity causes scope creep pressure during implementation
4. Parallel wave execution is highly effective for independent UI work — Phase 6's 6-agent wave demonstrates the ceiling for this pattern

### Cost Observations
- Model mix: 100% sonnet (claude-sonnet-4-6)
- 164 commits, 117 tests, 4,786 LOC
- Notable: 34 plans in 2 days — GSD parallel execution with wave scheduling was the primary efficiency driver

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 7 | 34 | First milestone — baseline established |

### Cumulative Quality

| Milestone | Tests | LOC | Commits |
|-----------|-------|-----|---------|
| v1.0 | 117 | 4,786 | 164 |

### Top Lessons (Verified Across Milestones)

1. Verify animation library compatibility before writing any animation code
2. Every checkpoint needs a formal artifact (SUMMARY.md) even when approved verbally
