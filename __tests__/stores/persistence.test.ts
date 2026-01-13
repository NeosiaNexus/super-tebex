import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBasketStore } from '../../src/stores/basketStore';
import { useUserStore } from '../../src/stores/userStore';

describe('Store Persistence', () => {
  beforeEach(() => {
    // Reset stores to initial state
    useBasketStore.setState({ basketIdent: null });
    useUserStore.setState({ username: null });
  });

  afterEach(() => {
    // Clean up
    useBasketStore.setState({ basketIdent: null });
    useUserStore.setState({ username: null });
  });

  describe('BasketStore', () => {
    it('should set basket ident correctly', () => {
      const { setBasketIdent } = useBasketStore.getState();

      setBasketIdent('test-basket-123');

      expect(useBasketStore.getState().basketIdent).toBe('test-basket-123');
    });

    it('should clear basket ident', () => {
      const { setBasketIdent, clearBasketIdent } = useBasketStore.getState();

      setBasketIdent('test-basket-123');
      expect(useBasketStore.getState().basketIdent).toBe('test-basket-123');

      clearBasketIdent();
      expect(useBasketStore.getState().basketIdent).toBeNull();
    });

    it('should update state multiple times', () => {
      const { setBasketIdent } = useBasketStore.getState();

      setBasketIdent('basket-1');
      expect(useBasketStore.getState().basketIdent).toBe('basket-1');

      setBasketIdent('basket-2');
      expect(useBasketStore.getState().basketIdent).toBe('basket-2');

      setBasketIdent('basket-3');
      expect(useBasketStore.getState().basketIdent).toBe('basket-3');
    });

    it('should have correct initial state', () => {
      const state = useBasketStore.getState();

      expect(state.basketIdent).toBeNull();
      expect(typeof state.setBasketIdent).toBe('function');
      expect(typeof state.clearBasketIdent).toBe('function');
    });
  });

  describe('UserStore', () => {
    it('should set username correctly', () => {
      const { setUsername } = useUserStore.getState();

      setUsername('TestPlayer');

      expect(useUserStore.getState().username).toBe('TestPlayer');
    });

    it('should clear username', () => {
      const { setUsername, clearUsername } = useUserStore.getState();

      setUsername('TestPlayer');
      expect(useUserStore.getState().username).toBe('TestPlayer');

      clearUsername();
      expect(useUserStore.getState().username).toBeNull();
    });

    it('should update username multiple times', () => {
      const { setUsername } = useUserStore.getState();

      setUsername('Player1');
      expect(useUserStore.getState().username).toBe('Player1');

      setUsername('Player2');
      expect(useUserStore.getState().username).toBe('Player2');
    });

    it('should have correct initial state', () => {
      const state = useUserStore.getState();

      expect(state.username).toBeNull();
      expect(typeof state.setUsername).toBe('function');
      expect(typeof state.clearUsername).toBe('function');
    });
  });

  describe('Cross-store consistency', () => {
    it('should maintain independent state between stores', () => {
      const { setBasketIdent } = useBasketStore.getState();
      const { setUsername } = useUserStore.getState();

      setBasketIdent('basket-123');
      setUsername('TestPlayer');

      expect(useBasketStore.getState().basketIdent).toBe('basket-123');
      expect(useUserStore.getState().username).toBe('TestPlayer');

      // Clearing one should not affect the other
      useBasketStore.getState().clearBasketIdent();

      expect(useBasketStore.getState().basketIdent).toBeNull();
      expect(useUserStore.getState().username).toBe('TestPlayer');
    });

    it('should auto-clear basket when clearing username (logout)', () => {
      useBasketStore.getState().setBasketIdent('basket-123');
      useUserStore.getState().setUsername('TestPlayer');

      useUserStore.getState().clearUsername();

      // Basket should be auto-cleared when username is cleared
      expect(useBasketStore.getState().basketIdent).toBeNull();
      expect(useUserStore.getState().username).toBeNull();
    });
  });

  describe('Store subscription', () => {
    it('should notify subscribers on basket state change', () => {
      const listener = vi.fn();

      // Subscribe to basket ident changes
      const unsubscribe = useBasketStore.subscribe(
        state => state.basketIdent,
        basketIdent => {
          listener(basketIdent);
        },
      );

      // Change state
      useBasketStore.getState().setBasketIdent('new-basket');

      expect(listener).toHaveBeenCalledWith('new-basket');

      // Cleanup
      unsubscribe();
    });

    it('should notify subscribers on user state change', () => {
      const listener = vi.fn();

      const unsubscribe = useUserStore.subscribe(
        state => state.username,
        username => {
          listener(username);
        },
      );

      useUserStore.getState().setUsername('NewPlayer');

      expect(listener).toHaveBeenCalledWith('NewPlayer');

      unsubscribe();
    });

    it('should not notify after unsubscribe', () => {
      const listener = vi.fn();

      const unsubscribe = useBasketStore.subscribe(
        state => state.basketIdent,
        basketIdent => {
          listener(basketIdent);
        },
      );

      unsubscribe();

      // Change state after unsubscribe
      useBasketStore.getState().setBasketIdent('new-basket');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = useBasketStore.subscribe(
        state => state.basketIdent,
        basketIdent => {
          listener1(basketIdent);
        },
      );

      const unsub2 = useBasketStore.subscribe(
        state => state.basketIdent,
        basketIdent => {
          listener2(basketIdent);
        },
      );

      useBasketStore.getState().setBasketIdent('shared-basket');

      expect(listener1).toHaveBeenCalledWith('shared-basket');
      expect(listener2).toHaveBeenCalledWith('shared-basket');

      unsub1();
      unsub2();
    });
  });

  describe('State reset behavior', () => {
    it('should reset basket store to initial state', () => {
      useBasketStore.getState().setBasketIdent('temp-basket');
      expect(useBasketStore.getState().basketIdent).toBe('temp-basket');

      useBasketStore.setState({ basketIdent: null });
      expect(useBasketStore.getState().basketIdent).toBeNull();
    });

    it('should reset user store to initial state', () => {
      useUserStore.getState().setUsername('TempPlayer');
      expect(useUserStore.getState().username).toBe('TempPlayer');

      useUserStore.setState({ username: null });
      expect(useUserStore.getState().username).toBeNull();
    });
  });
});
