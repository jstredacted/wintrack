import { NavLink } from "react-router";
import { LayoutDashboard, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", icon: LayoutDashboard, label: "Today", end: true },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
];

export default function BottomTabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 border-t border-border bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-14">
        {TABS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-150",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
              )
            }
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
