import { create } from 'zustand';

export interface ConnectionConfig {
    host: string;
    port: string;
    username: string;
    password?: string;
    name?: string;
}

export interface Session {
    id: string;
    config: ConnectionConfig;
    title: string;
    status: 'connected' | 'disconnected' | 'connecting' | 'lost';
}

interface AppState {
    sessions: Session[];
    activeSessionId: string | null;
    addSession: (session: Session) => void;
    removeSession: (id: string) => void;
    updateSessionStatus: (id: string, status: Session['status']) => void;
    updateSessionTitle: (id: string, title: string) => void;
    setActiveSessionId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
    sessions: [],
    activeSessionId: null,
    addSession: (session) => set((state) => ({
        sessions: [...state.sessions, session],
        activeSessionId: session.id
    })),
    removeSession: (id) => set((state) => {
        const newSessions = state.sessions.filter((s) => s.id !== id);
        let newActiveId = state.activeSessionId;

        if (state.activeSessionId === id) {
            newActiveId = newSessions.length > 0 ? newSessions[newSessions.length - 1].id : null;
        }

        return { sessions: newSessions, activeSessionId: newActiveId };
    }),
    updateSessionStatus: (id, status) => set((state) => ({
        sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, status } : s
        )
    })),
    updateSessionTitle: (id, title) => set((state) => ({
        sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title } : s
        )
    })),
    setActiveSessionId: (id) => set({ activeSessionId: id }),
}));
