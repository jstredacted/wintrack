import { create } from 'zustand';
import { getLocalDateString } from '@/lib/utils/date';

export const useUIStore = create((set) => ({
  // --- Phase 2 state (unchanged) ---
  inputOverlayOpen: false,
  editingWinId: null,
  rollForwardOffered: false,

  openInputOverlay: () => set({ inputOverlayOpen: true }),
  closeInputOverlay: () => set({ inputOverlayOpen: false }),
  setEditingWin: (id) => set({ editingWinId: id }),
  clearEditingWin: () => set({ editingWinId: null }),
  markRollForwardOffered: () => set({ rollForwardOffered: true }),

  // --- Phase 3 state ---
  checkinOverlayOpen: false,
  // morningDismissedDate / eveningDismissedDate: null means not dismissed yet today.
  // When set to a YYYY-MM-DD string matching today, the prompt is suppressed.
  // Resets naturally on next app open when the date changes — no explicit reset needed.
  morningDismissedDate: null,
  eveningDismissedDate: null,

  openCheckinOverlay: () => set({ checkinOverlayOpen: true }),
  closeCheckinOverlay: () => set({ checkinOverlayOpen: false }),
  dismissMorningPrompt: () => set({ morningDismissedDate: getLocalDateString() }),
  dismissEveningPrompt: () => set({ eveningDismissedDate: getLocalDateString() }),
}));
