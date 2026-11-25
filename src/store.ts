import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuickMode, SessionEntry } from './types';

interface AppState {
  mode: QuickMode;
  sessions: SessionEntry[];
  activeSessionId: string | null;
  setMode: (mode: QuickMode) => void;
  addSession: (entry: SessionEntry) => void;
  setActiveSession: (id: string | null) => void;
  clearSessions: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: 'auto',
      sessions: [],
      activeSessionId: null,
      setMode: (mode) => set({ mode }),
      addSession: (entry) =>
        set((s) => ({ sessions: [entry, ...s.sessions].slice(0, 30), activeSessionId: entry.id })),
      setActiveSession: (activeSessionId) => set({ activeSessionId }),
      clearSessions: () => set({ sessions: [], activeSessionId: null }),
    }),
    { name: 'omni-sessions-v1' },
  ),
);
