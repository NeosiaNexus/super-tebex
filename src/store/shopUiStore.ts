import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface ShopUiStore {
  isGlobalLoading: boolean;
  setIsGlobalLoading: (isGlobalLoading: boolean) => void;

  isCreatingBasket: boolean;
  setIsCreatingBasket: (isCreatingBasket: boolean) => void;
}

const useShopUiStore = create<ShopUiStore>()(
  subscribeWithSelector(set => ({
    isGlobalLoading: false,
    setIsGlobalLoading: (isGlobalLoading: boolean) => set({ isGlobalLoading }),

    isCreatingBasket: false,
    setIsCreatingBasket: (isCreatingBasket: boolean) => set({ isCreatingBasket }),
  })),
);

export default useShopUiStore;
