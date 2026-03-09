# Feature Research

**Domain:** Personal accountability / daily win tracking / focus tracker
**Researched:** 2026-03-09
**Confidence:** HIGH (validated against Stoic, Streaks, Centered, Reflect, and streak UX literature)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Win / intention logging | Core value of the product — without this there is nothing to track | LOW | The freeform, single-entry flow keeps it simple; complexity rises if you add types/categories (deliberately avoided here) |
| Evening check-in (binary completion) | Every accountability app has a "did you do it?" moment; skipping it removes the closure ritual | LOW | Yes/No per win is the right scope; avoid turning this into a scoring rubric |
| Streak counter | Users expect some persistence signal — streak is the genre's lingua franca | LOW | Simple increment on "at least one win complete for the day"; opt-in to turn off per Streaks app's design philosophy |
| Daily journal entry | The Stoic/Reflect pattern proves users want a free-write space separate from task logging | MEDIUM | Separate from wins to keep concerns cleanly split; title+body only is correct scope |
| Dark/light mode | Standard expectation in any tool used at 9pm in bed | LOW | Tailwind v4 dark mode + shadcn handles most of this structurally |
| Persistent data across sessions | Users assume notes survive a browser refresh or device switch | LOW | Supabase handles this; the only complexity is an offline-first edge case (defer to v2) |
| Visual history / past wins | Users need to look back to feel progress; without history the streak is just a number | MEDIUM | Calendar or list view of past days; streak calendar dot grid aligns with the project's aesthetic |
| Time tracking per win | Focus trackers always offer some form of time measurement; stopwatch on a win card is the minimal viable form | MEDIUM | Stopwatch (start/stop/pause) with cumulative display is right; Pomodoro mode or timers would be scope creep |
| Notification prompts (morning + evening) | Every app in this space has scheduled reminders; absence feels like the app forgot about you | MEDIUM | v1 stubs 9am/9pm times; actual push/browser notifications are v2 — document this clearly |

---

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Typeform-style win input (full-screen, one step at a time) | Reduces cognitive load at the moment of commitment — forces you to think about one win, not a list; Typeform's single-field pattern gets 2x industry completion rates | MEDIUM | Animated transitions + one-question-per-screen is the core UX bet; state machine per step, keyboard-forward |
| Roll incomplete wins forward | Honesty without punishment — most apps just mark you as failed; rollover supports a more compassionate self-accountability loop | LOW | Simple "roll to tomorrow" action on incomplete wins; surfaces carried-over wins distinctly on next day's view |
| Morning ritual framing (not task management) | The Stoic-energy check-in reframes the act as a deliberate practice, not a to-do list; this is the emotional differentiator vs. Todoist or Habitica | LOW | Whitespace-heavy layout, serif/mono type, meditative pacing — design carries the message |
| Nothing Phone / dot-grid aesthetic | No other app in this space uses this visual language; it signals "technical precision meets minimalism" and gives the product a distinct identity | LOW | Black/white only, dot grid patterns, monospaced type, structured negative space — enforced aesthetic constraint means this is a design system decision, not ongoing feature work |
| Stopwatch as first-class citizen on win card | Most habit trackers decouple time tracking; embedding the stopwatch directly on the win card reduces context switching and reinforces "this win is active" | MEDIUM | Per-win stopwatch state needs persistence between sessions (Supabase); cumulative time shown on card |
| Evening reflection note (optional, per win) | Adds qualitative texture to the binary yes/no — over time these micro-notes become a personal record of how your day actually felt | LOW | Optional text field alongside the check-in binary; kept out of the journal to stay win-specific |
| Streak opt-out | Streaks are motivating for some and toxic for others; letting users disable the streak counter signals product respect for intrinsic motivation over engagement metrics | LOW | Toggle in settings; Streaks app deliberately implemented this — cite the psychology: streaks should not profit from anxiety |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Win categories / types | Users want to organize wins by area (work, health, personal) | Adds classification overhead at input time — the friction point is exactly when you want zero friction; also means the app needs filter/sort UI everywhere | Freeform text only; users self-organize by what they type. Trust the user |
| Social sharing / leaderboards | Gamification playbook says add social pressure | Habit formation is a personal journey (Streaks app deliberately excluded this); social comparison creates anxiety that undermines the reflective ritual the product is selling | Build the private streak — let the user's own history be the signal |
| Journal tags / categories | Power users ask for this within weeks of using any journal app | Tags require a tagging UI, a tag management screen, a filter/search interface, and ongoing taxonomy decisions. The payoff is unclear for a personal single-user tool | Date-based browsing is sufficient; the body is searchable by text |
| AI coaching / prompts | Every journaling app added AI in 2024-2025 (Stoic, Reflect, Reflection.app all did) | This product's value is the ritual and the aesthetic — AI prompts change the emotional register from deliberate self-accountability to "the app is talking to me"; also requires API cost and latency management | Good prompt defaults ("What do you commit to today?") that the user owns; no AI in v1 |
| Streak freeze / forgiveness mechanic | Duolingo popularized this; users who miss a day want a safety net | For a single-user personal tool, the streak is a signal to yourself — a freeze feature adds complexity (who grants it? how many?) while solving a problem that's better addressed by making the action small (log one win, that's it) | Keep the required action minimal (one win = streak continues); if you miss a day, the history shows honestly. The rollover mechanic is the compassionate alternative |
| Pomodoro / interval timer | Time tracking users often want Pomodoro | The project already chose stopwatch as the time tracking primitive; adding Pomodoro adds a second time tracking mental model and a timer-completion notification layer | Stopwatch only in v1; users who want Pomodoro have dedicated apps (Be Focused, Focus To-Do) |
| Multi-device sync with offline-first | Users expect this once they use the app across devices | True offline-first requires conflict resolution logic, local storage layer, sync queue, and error states; this project has no auth layer and no sync conflict model | Supabase persistence works across devices when online; offline behavior undefined = acceptable for personal tool v1 |
| Win recurrence / templates | "I log the same wins every day" is common feedback | Recurring wins blur the line between habit tracking (Streaks does this) and daily intention setting; the product thesis is that each day's commitment is a deliberate choice, not a default | User types their wins fresh each morning; the Typeform flow makes this fast; if repetition bothers them, that's signal about the product's job-to-be-done |
| Push notifications (v1) | Users want to be reminded | Web push notifications require service worker setup, permission UX, and cross-browser testing; browser notification APIs are inconsistent across Safari/Chrome/Firefox | Document the intended 9am/9pm times in the UI; implement as a visible "reminder" UI element in v1 with a note that push notifications are coming |

---

## Feature Dependencies

```
[Win Logging (Typeform flow)]
    └──required by──> [Evening Check-in]
                          └──required by──> [Streak Counter]
                          └──required by──> [Roll Incomplete Forward]

[Win Logging]
    └──required by──> [Per-win Stopwatch]
    └──required by──> [Evening Reflection Note]

[Evening Check-in]
    └──required by──> [Visual History / Calendar]

[Win Logging + Evening Check-in]
    └──together power──> [Streak Counter]

[Journal Entry]
    └──independent of──> [Win Logging] (separate concern, separate data model)

[Dark/Light Mode]
    └──independent of──> all features (cross-cutting UI concern)

[Notification Prompts (stubbed)]
    └──depends on──> [Win Logging] (morning: "have you logged yet?")
    └──depends on──> [Evening Check-in] (evening: "have you checked in?")
```

### Dependency Notes

- **Evening check-in requires Win Logging:** There is nothing to check in on without wins declared. Win logging must ship first or in the same release.
- **Streak counter requires Evening check-in:** The streak increments based on completion status, not just declaration. If check-in is deferred, streak is meaningless.
- **Roll incomplete forward requires Win Logging + Evening check-in:** You need both the win record and the completion status to identify "incomplete" wins to roll.
- **Per-win Stopwatch requires Win Logging:** The stopwatch attaches to a win entity; it cannot exist without one.
- **Journal is independent:** The journal has its own data model (title + body + date) and does not reference wins. This is intentional — ship it independently.
- **Visual history requires both phases of the daily loop:** Showing past days meaningfully requires knowing which wins existed and whether they were completed.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what is needed to validate the daily discipline loop.

- [ ] Win logging via Typeform-style full-screen flow — this is the core commitment act; everything else depends on it
- [ ] Evening check-in (binary yes/no per win + optional reflection note) — closes the daily loop; without it there is no accountability
- [ ] Roll incomplete wins forward — the compassion mechanic; makes honesty feel safe
- [ ] Per-win stopwatch (start/stop/pause, cumulative time) — makes the focus tracking claim real
- [ ] Daily journal entry (title + body) — separate from wins; supports the evening ritual
- [ ] Streak counter — visible signal of consistency; single-digit implementation complexity
- [ ] Visual history (past days, win/completion status) — without it the streak is just a number
- [ ] Dark/light mode — expected; Tailwind v4 handles this cheaply
- [ ] Notification time stubs (show 9am/9pm prominently in UI) — sets expectations for v2 push notifications

### Add After Validation (v1.x)

- [ ] Actual browser push notifications (9am / 9pm) — validate that users want reminders before investing in service worker infrastructure; trigger: users ask "why didn't I get notified?"
- [ ] Streak opt-out toggle — add when users report streak anxiety; trigger: qualitative feedback that the counter feels punitive
- [ ] Grace window for streak (e.g., midnight + 1 hour) — small change, meaningful UX; trigger: users report losing streaks due to time zone edge cases

### Future Consideration (v2+)

- [ ] Offline-first / conflict resolution — requires auth layer reconsideration or local-first architecture; defer until the product proves worth the investment
- [ ] Export / data portability (JSON or CSV) — users will ask for this; not urgent for a single-user tool but important for trust
- [ ] Weekly review screen (pattern visualization across weeks) — Stoic and Reflect both do this well; adds insight layer on top of the daily loop; defer until daily loop is stable

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Win logging (Typeform flow) | HIGH | MEDIUM | P1 |
| Evening check-in | HIGH | LOW | P1 |
| Streak counter | HIGH | LOW | P1 |
| Roll incomplete wins forward | HIGH | LOW | P1 |
| Per-win stopwatch | HIGH | MEDIUM | P1 |
| Daily journal | MEDIUM | LOW | P1 |
| Visual history / calendar | HIGH | MEDIUM | P1 |
| Dark/light mode | MEDIUM | LOW | P1 |
| Notification stubs (UI only) | MEDIUM | LOW | P1 |
| Browser push notifications | MEDIUM | HIGH | P2 |
| Streak opt-out toggle | MEDIUM | LOW | P2 |
| Weekly pattern review | MEDIUM | MEDIUM | P3 |
| Export / data portability | MEDIUM | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Stoic | Streaks | Centered | wintrack Approach |
|---------|-------|---------|----------|-------------------|
| Morning/evening ritual loop | Morning + evening reflections with scheduled reminders | Not ritual-focused (habit completion only) | Focus session start/end | Full 9am/9pm loop is core; framed as ritual not task management |
| Streak mechanic | Streak counter + badge rewards; opt-out available | Streak is the primary mechanic; no points/levels; no social | Not streak-based | Simple day streak, opt-out toggle planned for v1.x |
| Journaling | Full journal with prompts, mood tracking, AI mentor | Not applicable | Not applicable | Title + body only, no prompts, no AI — deliberate restraint |
| Time tracking | None | None (completion-only) | Focus session timer (Pomodoro-style) | Per-win stopwatch embedded on win card |
| Social features | Optional community | Explicitly excluded | Peer accountability mode | None — single-user tool, no auth layer |
| Design language | Clean, wellness/mindfulness aesthetic | Colored circles, minimal | Clean productivity aesthetic | Black/white only, dot-grid, monospaced — Nothing Phone aesthetic |
| AI features | AI Mentor, personalized prompts (Premium) | None | AI distraction coaching | None in v1 — deliberate restraint |
| Win/goal input UX | Form-based, multi-step reflections | Tap to complete | Task list | Typeform-style full-screen one-at-a-time — the primary UX bet |
| Rollover / carry forward | Not a feature | Not a feature | Not applicable | Explicit rollover mechanic — differentiator in the accountability space |

---

## Sources

- [Stoic App Features Page](https://www.getstoic.com/features) — morning/evening loop, streak mechanics, journal UX
- [Stoic App 2025 Update Blog Post](https://www.getstoic.com/blog/stoic-journal-update-2025-18) — 2025 UX redesign details
- [Streaks App Gamification Case Study — Trophy.so](https://trophy.so/blog/streaks-gamification-case-study) — deliberate exclusions (no points, no leaderboards), streak philosophy
- [Designing a Streak System: UX and Psychology — Smashing Magazine](https://smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/) — loss aversion, freeze mechanics, healthy vs toxic streak design
- [Typeform One-Field Onboarding UX — Startup Spells](https://startupspells.com/p/typeform-one-field-onboarding-ux-gas-snapchat-duolingo-spotify-signup-conversion) — completion rate uplift, cognitive load reduction
- [What Happens When Users Lose Their Streaks — Trophy.so](https://trophy.so/blog/what-happens-when-users-lose-streaks) — streak forgiveness psychology
- [The 5 Best Habit Tracker Apps — Zapier](https://zapier.com/blog/best-habit-tracker-app/) — ecosystem overview, morning/evening routine patterns
- [Nothing Phone 2 Monochrome Theme — Android Authority](https://www.androidauthority.com/nothing-phone-2-monochrome-theme-3382235/) — monochrome aesthetic validation

---

*Feature research for: Personal accountability / daily win tracking / focus tracker (wintrack)*
*Researched: 2026-03-09*
