import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import { ShopBasketStore } from '../types';

const useShopBasketStore = create<ShopBasketStore>()(
  subscribeWithSelector(
    persist(
      set => ({
        basketIdent: null,
        setBasketIdent: (basketIdent: string) => set({ basketIdent }),
        clearBasketIdent: () => set({ basketIdent: null }),
      }),
      {
        name: 'shop-basket-store',
      },
    ),
  ),
);

export default useShopBasketStore;
