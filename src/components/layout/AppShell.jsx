import { Outlet } from "react-router";
import Header from "./Header";
import BottomTabBar from "./BottomTabBar";

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-svh bg-background text-foreground">
      <Header />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
