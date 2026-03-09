import { create } from 'zustand';

export const useUIStore = create((set) => ({
  inputOverlayOpen: false,
  editingWinId: null,
  rollForwardOffered: false,

  openInputOverlay: () => set({ inputOverlayOpen: true }),
  closeInputOverlay: () => set({ inputOverlayOpen: false }),
  setEditingWin: (id) => set({ editingWinId: id }),
  clearEditingWin: () => set({ editingWinId: null }),
  markRollForwardOffered: () => set({ rollForwardOffered: true }),
}));
