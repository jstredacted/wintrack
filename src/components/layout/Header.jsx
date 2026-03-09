import ThemeToggle from "../theme/ThemeToggle";
import { useStreak } from "@/hooks/useStreak";

export default function Header() {
  const { streak, journalStreak } = useStreak();

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      <span className="text-xs font-mono uppercase tracking-[0.2em] text-foreground">
        wintrack
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground tabular-nums">
          <span
            title="Wins streak"
            aria-label={`Wins streak: ${streak} days`}
          >
            {streak}W
          </span>
          <span
            title="Journal streak"
            aria-label={`Journal streak: ${journalStreak} days`}
          >
            {journalStreak}J
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
