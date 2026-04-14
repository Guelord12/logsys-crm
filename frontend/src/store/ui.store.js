import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  modalOpen: false,
  modalContent: null,
  toast: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),

  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null })
}));