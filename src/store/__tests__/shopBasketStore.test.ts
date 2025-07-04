import { vi } from 'vitest';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ShopBasketStore } from '../../types';
import useShopBasketStore from '../shopBasketStore';

beforeEach(() => {
  vi.resetAllMocks();
  useShopBasketStore.setState({ basketIdent: null });
});

describe('useShopBasketStore', () => {
  describe('initial state', () => {
    it('should initialize with basketIdent set to null', () => {
      expect(useShopBasketStore.getState().basketIdent).toBeNull();
    });
  });

  describe('state mutations', () => {
    it('should update basketIdent when setBasketIdent is called', () => {
      const { setBasketIdent } = useShopBasketStore.getState();
      setBasketIdent('abc123');
      expect(useShopBasketStore.getState().basketIdent).toBe('abc123');
    });

    it('should reset basketIdent to null when clearBasketIdent is called', () => {
      const { setBasketIdent, clearBasketIdent } = useShopBasketStore.getState();
      setBasketIdent('abc123');
      clearBasketIdent();
      expect(useShopBasketStore.getState().basketIdent).toBeNull();
    });

    it('should allow multiple consecutive updates to basketIdent', () => {
      const { setBasketIdent } = useShopBasketStore.getState();
      setBasketIdent('first');
      expect(useShopBasketStore.getState().basketIdent).toBe('first');
      setBasketIdent('second');
      expect(useShopBasketStore.getState().basketIdent).toBe('second');
    });
  });

  describe('localStorage persistence', () => {
    it('should persist basketIdent to localStorage', () => {
      const mockSetItem = vi.fn();

      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: mockSetItem,
        removeItem: vi.fn(),
      });

      const useTestStore = create<ShopBasketStore>()(
        persist(
          set => ({
            basketIdent: null,
            setBasketIdent: id => set({ basketIdent: id }),
            clearBasketIdent: () => set({ basketIdent: null }),
          }),
          { name: 'test-basket-store' },
        ),
      );

      useTestStore.getState().setBasketIdent('persisted-id');

      expect(mockSetItem).toHaveBeenCalledWith(
        'test-basket-store',
        expect.stringContaining('persisted-id'),
      );
    });

    it('should not throw if localStorage is not mocked', () => {
      expect(() => {
        useShopBasketStore.getState().setBasketIdent('safe-fallback');
      }).not.toThrow();
    });

    it('should not call removeItem when clearBasketIdent is called (noop expected)', () => {
      const mockRemoveItem = vi.fn();

      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: mockRemoveItem,
      });

      const useTestStore = create<ShopBasketStore>()(
        persist(
          set => ({
            basketIdent: null,
            setBasketIdent: id => set({ basketIdent: id }),
            clearBasketIdent: () => set({ basketIdent: null }),
          }),
          { name: 'test-basket-store' },
        ),
      );

      useTestStore.getState().clearBasketIdent();
      expect(mockRemoveItem).not.toHaveBeenCalled();
    });
  });

  describe('performance under stress', () => {
    it('should handle 10,000 basketIdent updates in under 100ms', () => {
      const { setBasketIdent } = useShopBasketStore.getState();

      const start = performance.now();
      for (let i = 0; i < 10_000; i++) {
        setBasketIdent(`item-${i}`);
      }
      const duration = performance.now() - start;

      expect(useShopBasketStore.getState().basketIdent).toBe('item-9999');
      expect(duration).toBeLessThan(100);
    });

    it('should handle 10,000 basketIdent clear calls in under 100ms', () => {
      const { setBasketIdent, clearBasketIdent } = useShopBasketStore.getState();

      setBasketIdent('initial');

      const start = performance.now();
      for (let i = 0; i < 10_000; i++) {
        clearBasketIdent();
      }
      const duration = performance.now() - start;

      expect(useShopBasketStore.getState().basketIdent).toBeNull();
      expect(duration).toBeLessThan(100);
    });
  });

  describe('state equality optimization', () => {
    it('should not trigger re-renders when basketIdent is set to the same value', () => {
      const onRender = vi.fn();

      const unsubscribe = useShopBasketStore.subscribe(state => state.basketIdent, onRender, {
        equalityFn: Object.is,
      });

      useShopBasketStore.setState({ basketIdent: null });

      // No-op update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useShopBasketStore.getState().setBasketIdent(null as any);
      expect(onRender).not.toHaveBeenCalled();

      // Real update
      useShopBasketStore.getState().setBasketIdent('value');
      expect(onRender).toHaveBeenCalledTimes(1);

      // Redundant update
      useShopBasketStore.getState().setBasketIdent('value');
      expect(onRender).toHaveBeenCalledTimes(1);

      unsubscribe();
    });
  });
});
