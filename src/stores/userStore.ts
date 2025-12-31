'use client';

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

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
        },
      }),
      {
        name: 'tebex-user-store',
        // Skip hydration on server to avoid hydration mismatch
        skipHydration: typeof window === 'undefined',
      },
    ),
  ),
);

// Re-export types for consumers
export type { UserStore, UserStoreActions, UserStoreState };
