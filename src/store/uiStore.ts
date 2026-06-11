// ─── Zustand UI Store ────────────────────────────────────────

import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  celebrationEventId: string | null;
  activeSplash: boolean;
  isOnline: boolean;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  triggerCelebration: (eventId: string | null) => void;
  setSplashActive: (active: boolean) => void;
  setOnline: (online: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  celebrationEventId: null,
  activeSplash: true,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  triggerCelebration: (eventId) => set({ celebrationEventId: eventId }),
  setSplashActive: (active) => set({ activeSplash: active }),
  setOnline: (online) => set({ isOnline: online }),
}));
