'use client';

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import { useBasketStore } from './basketStore';

/**
 * User store state interface.
 */
interface UserStoreState {
  readonly username: string | null;
}

/**
 * User store actions interface.
 */
interface UserStoreActions {
  readonly setUsername: (username: string) => void;
  readonly clearUsername: () => void;
}

/**
 * Complete user store type.
 */
type UserStore = UserStoreState & UserStoreActions;

/**
 * Zustand store for user data persistence.
 * Uses localStorage to persist the username (Minecraft username) across sessions.
 */
export const useUserStore = create<UserStore>()(
  subscribeWithSelector(
    persist(
      set => ({
        username: null,
        setUsername: (username: string) => {
          set({ username });
        },
        clearUsername: () => {
          set({ username: null });
          useBasketStore.getState().clearBasketIdent();
        },
      }),
      {
        name: 'tebex-user-store',
        // Skip hydration — rehydrated manually in TebexProvider
        skipHydration: true,
        version: 1,
        partialize: (state: UserStore) => ({ username: state.username }),
        migrate: (persistedState: unknown) => {
          if (
            typeof persistedState === 'object' &&
            persistedState !== null &&
            'username' in persistedState
          ) {
            const state = persistedState as Record<string, unknown>;
            return {
              username: typeof state.username === 'string' ? state.username : null,
            };
          }
          return { username: null };
        },
        onRehydrateStorage: () => {
          return (_state: unknown, error?: unknown) => {
            if (error !== undefined) {
              // eslint-disable-next-line no-console
              console.warn('[tebex] Failed to rehydrate user store:', error);
            }
          };
        },
      },
    ),
  ),
);

export type { UserStore, UserStoreActions, UserStoreState };
