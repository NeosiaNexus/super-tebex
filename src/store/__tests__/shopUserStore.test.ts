import { vi } from 'vitest';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import shopUserStore, { ShopUserStore } from '../shopUserStore';

beforeEach(() => {
  vi.resetAllMocks();
  shopUserStore.setState({ username: '' });
});

describe('shopUserStore', () => {
  describe('initial state', () => {
    it('should initialize with username set to empty string', () => {
      expect(shopUserStore.getState().username).toBe('');
    });
  });

  describe('state mutations', () => {
    it('should update username when setUsername is called', () => {
      const { setUsername } = shopUserStore.getState();
      setUsername('Mathéo');
      expect(shopUserStore.getState().username).toBe('Mathéo');
    });

    it('should reset username to empty string when clearUsername is called', () => {
      const { setUsername, clearUsername } = shopUserStore.getState();
      setUsername('Mathéo');
      clearUsername();
      expect(shopUserStore.getState().username).toBe('');
    });

    it('should allow multiple consecutive updates to username', () => {
      const { setUsername } = shopUserStore.getState();
      setUsername('first');
      expect(shopUserStore.getState().username).toBe('first');
      setUsername('second');
      expect(shopUserStore.getState().username).toBe('second');
    });
  });

  describe('localStorage persistence', () => {
    it('should persist username to localStorage', () => {
      const mockSetItem = vi.fn();

      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: mockSetItem,
        removeItem: vi.fn(),
      });

      const useTestStore = create<ShopUserStore>()(
        persist(
          set => ({
            username: '',
            setUsername: (username: string) => set({ username }),
            clearUsername: () => set({ username: '' }),
          }),
          { name: 'test-user-store' },
        ),
      );

      useTestStore.getState().setUsername('persisted-user');

      expect(mockSetItem).toHaveBeenCalledWith(
        'test-user-store',
        expect.stringContaining('persisted-user'),
      );
    });

    it('should not throw if localStorage is not mocked', () => {
      expect(() => {
        shopUserStore.getState().setUsername('safe-fallback');
      }).not.toThrow();
    });

    it('should not call removeItem when clearUsername is called (noop expected)', () => {
      const mockRemoveItem = vi.fn();

      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: mockRemoveItem,
      });

      const useTestStore = create<ShopUserStore>()(
        persist(
          set => ({
            username: '',
            setUsername: (username: string) => set({ username }),
            clearUsername: () => set({ username: '' }),
          }),
          { name: 'test-user-store' },
        ),
      );

      useTestStore.getState().clearUsername();
      expect(mockRemoveItem).not.toHaveBeenCalled();
    });
  });

  describe('state equality optimization', () => {
    it('should not trigger re-renders when username is set to the same value', () => {
      const onRender = vi.fn();

      const unsubscribe = shopUserStore.subscribe(state => state.username, onRender, {
        equalityFn: Object.is,
      });

      shopUserStore.setState({ username: '' });

      // No-op update
      shopUserStore.getState().setUsername('');
      expect(onRender).not.toHaveBeenCalled();

      // Real update
      shopUserStore.getState().setUsername('user');
      expect(onRender).toHaveBeenCalledTimes(1);

      // Redundant update
      shopUserStore.getState().setUsername('user');
      expect(onRender).toHaveBeenCalledTimes(1);

      unsubscribe();
    });
  });

  describe('performance under stress', () => {
    it('should handle 10,000 username updates in under 100ms', () => {
      const { setUsername } = shopUserStore.getState();

      const start = performance.now();
      for (let i = 0; i < 10_000; i++) {
        setUsername(`user-${i}`);
      }
      const duration = performance.now() - start;

      expect(shopUserStore.getState().username).toBe('user-9999');
      expect(duration).toBeLessThan(100);
    });

    it('should handle 10,000 username clears in under 100ms', () => {
      const { setUsername, clearUsername } = shopUserStore.getState();

      setUsername('initial');

      const start = performance.now();
      for (let i = 0; i < 10_000; i++) {
        clearUsername();
      }
      const duration = performance.now() - start;

      expect(shopUserStore.getState().username).toBe('');
      expect(duration).toBeLessThan(100);
    });
  });
});
