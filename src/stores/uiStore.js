import { create } from 'zustand';
import { getLocalDateString } from '@/lib/utils/date';

function readDate(key) {
  try { return localStorage.getItem(key) || null; } catch { return null; }
}
function writeDate(key) {
  const d = getLocalDateString();
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
  markRollForwardOffered: () => set({ rollForwardOfferedDate: writeDate('rollForwardOfferedDate') }),

  // --- Phase 3 state ---
  checkinOverlayOpen: false,
  // *DismissedDate: YYYY-MM-DD string persisted to localStorage.
  // Suppresses prompt for the rest of the day; resets automatically on next day.
  morningDismissedDate: readDate('morningDismissedDate'),
  eveningDismissedDate: readDate('eveningDismissedDate'),

  openCheckinOverlay: () => set({ checkinOverlayOpen: true }),
  closeCheckinOverlay: () => set({ checkinOverlayOpen: false }),
  dismissMorningPrompt: () => set({ morningDismissedDate: writeDate('morningDismissedDate') }),
  dismissEveningPrompt: () => set({ eveningDismissedDate: writeDate('eveningDismissedDate') }),
}));
