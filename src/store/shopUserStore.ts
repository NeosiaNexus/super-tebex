import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

export interface ShopUserStore {
  username: string;
  setUsername: (username: string) => void;
  clearUsername: () => void;
}

const shopUserStore = create<ShopUserStore>()(
  subscribeWithSelector(
    persist(
      set => ({
        username: '',
        setUsername: (username: string) => set({ username }),
        clearUsername: () => set({ username: '' }),
      }),
      {
        name: 'shop-user-store',
      },
    ),
  ),
);

export default shopUserStore;
