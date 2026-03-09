import { getLocalDateString } from "@/lib/utils/date";

export default function TodayPage() {
  const today = getLocalDateString();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100svh-7rem)] gap-3 p-6 text-center">
      <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {today}
      </p>
      <p className="text-sm font-mono text-muted-foreground">
        No wins logged yet
      </p>
    </div>
  );
}
