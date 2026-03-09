import { Outlet } from "react-router";
import Header from "./Header";
import BottomTabBar from "./BottomTabBar";

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-svh bg-background text-foreground dot-grid">
      <Header />
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="max-w-[1100px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
