import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShopUserStore {
  username: string;
  setUsername: (username: string) => void;
  clearUsername: () => void;
}

const shopUserStore = create<ShopUserStore>()(
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
);

export default shopUserStore;
