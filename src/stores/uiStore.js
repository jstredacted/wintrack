import { create } from 'zustand';
import { getLocalDateString } from '@/lib/utils/date';

function readDate(key) {
  try { return localStorage.getItem(key) || null; } catch { return null; }
}
function writeDate(key, dayStartHour = 0) {
  const d = getLocalDateString(new Date(), dayStartHour);
  try { localStorage.setItem(key, d); } catch {}
  return d;
}

export const useUIStore = create((set) => ({
  // --- Phase 2 state (unchanged) ---
  inputOverlayOpen: false,
  editingWinId: null,
  rollForwardOfferedDate: readDate('rollForwardOfferedDate'),

  openInputOverlay: () => set({ inputOverlayOpen: true }),
  closeInputOverlay: () => set({ inputOverlayOpen: false }),
  setEditingWin: (id) => set({ editingWinId: id }),
  clearEditingWin: () => set({ editingWinId: null }),
  markRollForwardOffered: (dayStartHour) => set({ rollForwardOfferedDate: writeDate('rollForwardOfferedDate', dayStartHour) }),

  // --- Phase 3 state ---
  checkinOverlayOpen: false,
  // *DismissedDate: YYYY-MM-DD string persisted to localStorage.
  // Suppresses prompt for the rest of the day; resets automatically on next day.
  morningDismissedDate: readDate('morningDismissedDate'),
  eveningDismissedDate: readDate('eveningDismissedDate'),

  openCheckinOverlay: () => set({ checkinOverlayOpen: true }),
  closeCheckinOverlay: () => set({ checkinOverlayOpen: false }),
  dismissMorningPrompt: (dayStartHour) => set({ morningDismissedDate: writeDate('morningDismissedDate', dayStartHour) }),
  dismissEveningPrompt: (dayStartHour) => set({ eveningDismissedDate: writeDate('eveningDismissedDate', dayStartHour) }),

  // --- Phase 5 state ---
  timerOverlayOpen: false,
  openTimerOverlay: () => set({ timerOverlayOpen: true }),
  closeTimerOverlay: () => set({ timerOverlayOpen: false }),

  // Increment to trigger useStreak refetch (after journal save or checkin complete)
  streakRefreshKey: 0,
  refreshStreak: () => set((s) => ({ streakRefreshKey: s.streakRefreshKey + 1 })),

  // --- Dev tools state (toggled via Ctrl+Shift+D in dev mode) ---
  devToolsOpen: false,
  toggleDevTools: () => set((s) => ({ devToolsOpen: !s.devToolsOpen })),
  closeDevTools: () => set({ devToolsOpen: false }),
}));
