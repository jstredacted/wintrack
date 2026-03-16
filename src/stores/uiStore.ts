import { create } from 'zustand';
import { getLocalDateString } from '@/lib/utils/date';

interface UIState {
  inputOverlayOpen: boolean;
  editingWinId: string | null;
  rollForwardOfferedDate: string | null;
  openInputOverlay: () => void;
  closeInputOverlay: () => void;
  setEditingWin: (id: string) => void;
  clearEditingWin: () => void;
  markRollForwardOffered: (dayStartHour: number) => void;
  streakRefreshKey: number;
  refreshStreak: () => void;
  devToolsOpen: boolean;
  toggleDevTools: () => void;
  closeDevTools: () => void;
}

function readDate(key: string): string | null {
  try { return localStorage.getItem(key) || null; } catch { return null; }
}
function writeDate(key: string, dayStartHour: number = 0): string {
  const d = getLocalDateString(new Date(), dayStartHour);
  try { localStorage.setItem(key, d); } catch {}
  return d;
}

export const useUIStore = create<UIState>()((set) => ({
  // --- Phase 2 state (unchanged) ---
  inputOverlayOpen: false,
  editingWinId: null,
  rollForwardOfferedDate: readDate('rollForwardOfferedDate'),

  openInputOverlay: () => set({ inputOverlayOpen: true }),
  closeInputOverlay: () => set({ inputOverlayOpen: false }),
  setEditingWin: (id) => set({ editingWinId: id }),
  clearEditingWin: () => set({ editingWinId: null }),
  markRollForwardOffered: (dayStartHour) => set({ rollForwardOfferedDate: writeDate('rollForwardOfferedDate', dayStartHour) }),

  // Increment to trigger useStreak refetch (after journal save or win toggle)
  streakRefreshKey: 0,
  refreshStreak: () => set((s) => ({ streakRefreshKey: s.streakRefreshKey + 1 })),

  // --- Dev tools state (toggled via Ctrl+Shift+D in dev mode) ---
  devToolsOpen: false,
  toggleDevTools: () => set((s) => ({ devToolsOpen: !s.devToolsOpen })),
  closeDevTools: () => set({ devToolsOpen: false }),
}));
