import { Outlet } from 'react-router';
import SideNav from './SideNav';

export default function AppShell() {
  return (
    <div className="flex h-svh bg-background text-foreground dot-grid">
      <SideNav />
      <main className="ml-14 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
