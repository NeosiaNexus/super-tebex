'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector, type StateStorage } from 'zustand/middleware';

/**
 * Basket store state interface.
 */
interface BasketStoreState {
  readonly basketIdent: string | null;
}

/**
 * Basket store actions interface.
 */
interface BasketStoreActions {
  readonly setBasketIdent: (ident: string) => void;
  readonly clearBasketIdent: () => void;
}

/**
 * Complete basket store type.
 */
type BasketStore = BasketStoreState & BasketStoreActions;

/**
 * Zustand store for basket ident persistence.
 * Uses localStorage to persist the basket ident across sessions.
 */
export const useBasketStore = create<BasketStore>()(
  subscribeWithSelector(
    persist(
      set => ({
        basketIdent: null,
        setBasketIdent: (ident: string) => {
          set({ basketIdent: ident });
        },
        clearBasketIdent: () => {
          set({ basketIdent: null });
        },
      }),
      {
        name: 'tebex-basket-store',
        // SSR-safe storage: avoids persist middleware early-return when window
        // is undefined, which would leave .persist API unattached (zustand 5.x).
        storage: createJSONStorage((): StateStorage => {
          if (typeof window !== 'undefined') return window.localStorage;
          return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
        }),
        // Skip hydration — rehydrated manually in TebexProvider
        skipHydration: true,
        version: 1,
        partialize: (state: BasketStore) => ({ basketIdent: state.basketIdent }),
        migrate: (persistedState: unknown) => {
          if (
            typeof persistedState === 'object' &&
            persistedState !== null &&
            'basketIdent' in persistedState
          ) {
            const state = persistedState as Record<string, unknown>;
            return {
              basketIdent: typeof state.basketIdent === 'string' ? state.basketIdent : null,
            };
          }
          return { basketIdent: null };
        },
        onRehydrateStorage: () => {
          return (_state: unknown, error?: unknown) => {
            if (error !== undefined) {
              // eslint-disable-next-line no-console
              console.warn('[tebex] Failed to rehydrate basket store:', error);
            }
          };
        },
      },
    ),
  ),
);

export type { BasketStore, BasketStoreActions, BasketStoreState };
