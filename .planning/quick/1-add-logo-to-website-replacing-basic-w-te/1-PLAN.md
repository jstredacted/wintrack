---
phase: quick-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/logo.png
  - index.html
  - src/components/layout/SideNav.jsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Logo image displays in the sidebar instead of the W text"
    - "Logo is visible in both light mode and dark mode"
    - "Browser tab shows the logo as favicon instead of the Vite logo"
  artifacts:
    - path: "public/logo.png"
      provides: "Logo asset served as static file"
    - path: "src/components/layout/SideNav.jsx"
      provides: "Logo rendered in nav header slot"
    - path: "index.html"
      provides: "Favicon pointing to logo.png"
  key_links:
    - from: "src/components/layout/SideNav.jsx"
      to: "public/logo.png"
      via: "<img src='/logo.png' />"
      pattern: "src.*logo\\.png"
    - from: "index.html"
      to: "public/logo.png"
      via: "<link rel='icon' href='/logo.png' />"
      pattern: "href.*logo\\.png"
---

<objective>
Replace the "W" text monogram in the SideNav with the Wintrack logo image, and update the browser tab favicon from the Vite SVG to the logo.

Purpose: Give the app a real brand identity instead of a placeholder monogram.
Output: logo.png in public/, favicon updated, SideNav renders the image with dark mode CSS blend trick.
</objective>

<execution_context>
@/Users/justin/.claude/get-shit-done/workflows/execute-plan.md
@/Users/justin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Copy logo asset to public/ and update favicon</name>
  <files>public/logo.png, index.html</files>
  <action>
    Copy the logo from `/Users/justin/Downloads/Wintrack Logo.png` to `public/logo.png` using the Bash tool:
    ```
    cp "/Users/justin/Downloads/Wintrack Logo.png" /Users/justin/Repositories/Personal/wintrack/public/logo.png
    ```

    Then update `index.html`: replace the existing favicon `<link>` that points to `/vite.svg` with:
    ```html
    <link rel="icon" type="image/png" href="/logo.png" />
    ```
  </action>
  <verify>
    <automated>ls -lh /Users/justin/Repositories/Personal/wintrack/public/logo.png && grep 'logo.png' /Users/justin/Repositories/Personal/wintrack/index.html</automated>
  </verify>
  <done>public/logo.png exists and index.html favicon href points to /logo.png</done>
</task>

<task type="auto">
  <name>Task 2: Replace W monogram with logo image in SideNav</name>
  <files>src/components/layout/SideNav.jsx</files>
  <action>
    In `src/components/layout/SideNav.jsx`, replace the existing monogram div:
    ```jsx
    <div aria-label="wintrack" className="h-14 flex items-center justify-center text-xs font-mono uppercase tracking-widest text-muted-foreground/50 select-none">
      W
    </div>
    ```

    With this image element:
    ```jsx
    <div aria-label="wintrack" className="h-14 flex items-center justify-center select-none">
      <img
        src="/logo.png"
        alt="Wintrack"
        className="w-8 h-8 dark:invert dark:mix-blend-screen mix-blend-multiply"
      />
    </div>
    ```

    The CSS technique:
    - Light mode: `mix-blend-mode: multiply` — the white background of the PNG becomes transparent against the white sidebar, leaving only the black logo mark visible.
    - Dark mode: `dark:invert` inverts the PNG (black mark becomes white, white bg becomes black) then `dark:mix-blend-screen` makes the black background transparent, leaving the white mark visible against the dark sidebar.

    Do NOT use Tailwind's `dark:` prefix on `mix-blend-multiply` — that class applies regardless of theme. Only `dark:invert` and `dark:mix-blend-screen` are prefixed.
  </action>
  <verify>
    <automated>grep -n "logo.png" /Users/justin/Repositories/Personal/wintrack/src/components/layout/SideNav.jsx</automated>
  </verify>
  <done>SideNav renders img tag pointing to /logo.png with blend mode classes; W text div is removed</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Logo in sidebar and favicon in browser tab, both with dark/light mode support</what-built>
  <how-to-verify>
    1. Run the dev server: `mise exec -- bun run dev`
    2. Open the app in the browser
    3. Light mode: logo should appear as a black mark in the sidebar (white background of PNG disappears)
    4. Dark mode: toggle to dark — logo should appear white/inverted in the sidebar
    5. Check the browser tab — should show the logo instead of the Vite triangle icon
    6. Reload the page and confirm the favicon persists
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues</resume-signal>
</task>

</tasks>

<verification>
- public/logo.png exists and is the correct asset
- index.html favicon link points to /logo.png (not /vite.svg)
- SideNav uses img tag with blend mode classes, W text div removed
- Logo visible in both light and dark mode
</verification>

<success_criteria>
The Wintrack logo appears in the left sidebar where the "W" text was. The browser tab favicon is the logo. In light mode the black mark shows cleanly; in dark mode it inverts to white. No visual regressions elsewhere.
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-logo-to-website-replacing-basic-w-te/1-SUMMARY.md`
</output>
