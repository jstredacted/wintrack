import ThemeToggle from "../theme/ThemeToggle";
import { useStreak } from "@/hooks/useStreak";

export default function Header() {
  const { streak } = useStreak();

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      <span className="text-xs font-mono uppercase tracking-[0.2em] text-foreground">
        wintrack
      </span>
      <div className="flex items-center gap-3">
        <span
          className="text-sm font-mono text-muted-foreground tabular-nums"
          aria-label={`Streak: ${streak} days`}
          title="Consecutive days with a completed win"
        >
          {streak}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
