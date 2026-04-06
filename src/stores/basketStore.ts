'use client';

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

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
