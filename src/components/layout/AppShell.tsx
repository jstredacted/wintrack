import { useEffect } from 'react';
import { Outlet } from 'react-router';
import SideNav from './SideNav';
import { useUIStore } from '@/stores/uiStore';
import DevToolsPanel from '../dev/DevToolsPanel';

export default function AppShell() {
  const devToolsOpen = useUIStore((s) => s.devToolsOpen);
  const toggleDevTools = useUIStore((s) => s.toggleDevTools);
  const closeDevTools = useUIStore((s) => s.closeDevTools);

  useEffect(() => {
    if (!__DEV_TOOLS_ENABLED__) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDevTools();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleDevTools]);

  return (
    <div className="flex h-svh bg-background text-foreground dot-grid">
      <SideNav />
      <main className="ml-14 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {__DEV_TOOLS_ENABLED__ && (
        <DevToolsPanel open={devToolsOpen} onClose={closeDevTools} />
      )}
    </div>
  );
}
