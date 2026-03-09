// ThemeToggle is implemented in Plan 04 (same wave).
// Import it now — it will resolve once Plan 04 runs.
// If running this plan before 04, the import will fail at runtime — that's expected.
import ThemeToggle from "../theme/ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      <span className="text-xs font-mono uppercase tracking-[0.2em] text-foreground">
        wintrack
      </span>
      <ThemeToggle />
    </header>
  );
}
