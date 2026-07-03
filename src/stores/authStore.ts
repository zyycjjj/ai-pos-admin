import { create } from 'zustand';

import type { AuthSession, AuthStore, AuthUser, StoreRole } from '../types/auth';

const storageKey = 'ai-pos-admin-session';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  stores: AuthStore[];
  activeStoreId: string | null;
  role: StoreRole | null;
  permissions: string[];
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  setActiveStore: (storeId: string) => void;
  logout: () => void;
};

function readSession(): AuthSession | null {
  const value = localStorage.getItem(storageKey);
  if (!value) {
    return null;
  }
  try {
    const session = JSON.parse(value) as AuthSession;
    return session.accessToken && session.activeStoreId ? session : null;
  } catch {
    return null;
  }
}

const initialSession = readSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initialSession?.accessToken ?? null,
  user: initialSession?.user ?? null,
  stores: initialSession?.stores ?? [],
  activeStoreId: initialSession?.activeStoreId ?? null,
  role: initialSession?.role ?? null,
  permissions: initialSession?.permissions ?? [],
  isAuthenticated: Boolean(initialSession?.accessToken),
  setSession: (session) => {
    localStorage.setItem(storageKey, JSON.stringify(session));
    set({ ...session, isAuthenticated: true });
  },
  setActiveStore: (storeId) => {
    const state = get();
    const selected = state.stores.find((store) => store.storeId === storeId);
    if (!selected || !state.accessToken || !state.user) {
      return;
    }
    const session: AuthSession = {
      accessToken: state.accessToken,
      user: state.user,
      stores: state.stores,
      activeStoreId: storeId,
      role: selected.role,
      permissions: state.permissions,
    };
    localStorage.setItem(storageKey, JSON.stringify(session));
    set(session);
  },
  logout: () => {
    localStorage.removeItem(storageKey);
    set({
      accessToken: null,
      user: null,
      stores: [],
      activeStoreId: null,
      role: null,
      permissions: [],
      isAuthenticated: false,
    });
  },
}));
