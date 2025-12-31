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
        // Skip hydration on server to avoid hydration mismatch
        skipHydration: typeof window === 'undefined',
      },
    ),
  ),
);

// Re-export types for consumers
export type { BasketStore, BasketStoreActions, BasketStoreState };
