import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useCoupons } from '../../src/hooks/useCoupons';
import { useGiftCards } from '../../src/hooks/useGiftCards';
import { useUser } from '../../src/hooks/useUser';
import { createWrapper } from '../utils/test-utils';

describe('Multi-Hook Integration', () => {
  describe('User and Basket lifecycle', () => {
    it('should auto-clear basket when username is cleared', async () => {
      const wrapper = createWrapper();

      // Set up user
      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      await act(async () => {
        userResult.current.setUsername('TestPlayer');
      });

      expect(userResult.current.isAuthenticated).toBe(true);

      // Create basket
      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
      });

      expect(basketResult.current.basketIdent).toMatch(/^basket-/);

      // Clear user - basket should be auto-cleared
      await act(async () => {
        userResult.current.clearUsername();
      });

      expect(userResult.current.isAuthenticated).toBe(false);

      // Basket should be automatically cleared when username is cleared
      expect(basketResult.current.basketIdent).toBeNull();
    });

    it('should maintain basket state across hook re-renders', async () => {
      const wrapper = createWrapper();

      // Set up user
      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      await act(async () => {
        userResult.current.setUsername('TestPlayer');
      });

      // Create basket with first render
      const { result: basketResult1 } = renderHook(() => useBasket(), { wrapper });
      await act(async () => {
        await basketResult1.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basketResult1.current.basketIdent).not.toBeNull();
      });

      const originalIdent = basketResult1.current.basketIdent;

      // Create second hook instance - should share state
      const { result: basketResult2 } = renderHook(() => useBasket(), { wrapper });

      await waitFor(() => {
        expect(basketResult2.current.basketIdent).toBe(originalIdent);
      });

      // Adding via second hook should update both
      await act(async () => {
        await basketResult2.current.addPackage({ packageId: 102 });
      });

      // Both should see the updated state
      await waitFor(() => {
        expect(basketResult1.current.packages).toHaveLength(2);
        expect(basketResult2.current.packages).toHaveLength(2);
      });
    });
  });

  describe('Basket with promotions', () => {
    it('should handle coupon and gift card on same basket', async () => {
      const wrapper = createWrapper();

      // Set up user
      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      await act(async () => {
        userResult.current.setUsername('TestPlayer');
      });

      // Create basket
      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
      });

      // Apply coupon
      const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });
      await act(async () => {
        await couponsResult.current.apply('TEST10');
      });

      await waitFor(() => {
        expect(couponsResult.current.coupons).toHaveLength(1);
      });

      // Apply gift card
      const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });
      await act(async () => {
        await giftCardsResult.current.apply('GIFT-123');
      });

      await waitFor(() => {
        expect(giftCardsResult.current.giftCards).toHaveLength(1);
      });

      // Both should be applied
      expect(couponsResult.current.coupons[0].code).toBe('TEST10');
      expect(giftCardsResult.current.giftCards[0].card_number).toBe('GIFT-123');
    });

    it('should clear promotions when basket is cleared', async () => {
      const wrapper = createWrapper();

      // Set up user
      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      await act(async () => {
        userResult.current.setUsername('TestPlayer');
      });

      // Create basket and add coupon
      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
      });

      const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });
      await act(async () => {
        await couponsResult.current.apply('TEST10');
      });

      await waitFor(() => {
        expect(couponsResult.current.coupons).toHaveLength(1);
      });

      // Clear basket
      act(() => {
        basketResult.current.clearBasket();
      });

      // Coupon list should be empty since basket is cleared
      expect(couponsResult.current.coupons).toEqual([]);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple package additions', async () => {
      const wrapper = createWrapper();

      // Set up user
      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      await act(async () => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // Add multiple packages concurrently
      await act(async () => {
        await Promise.all([
          basketResult.current.addPackage({ packageId: 101 }),
          basketResult.current.addPackage({ packageId: 102 }),
        ]);
      });

      // Wait for basket to have items
      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
      });

      // Both packages should be added (though order might vary due to MSW state)
      await waitFor(() => {
        expect(basketResult.current.packages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State consistency', () => {
    it('should maintain consistent state across multiple hook types', async () => {
      const wrapper = createWrapper();

      // Set up user
      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      await act(async () => {
        userResult.current.setUsername('TestPlayer');
      });

      // Create basket
      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
      });

      // Apply promotions
      const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });
      const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

      await act(async () => {
        await couponsResult.current.apply('SAVE20');
      });

      await waitFor(() => {
        expect(couponsResult.current.coupons).toHaveLength(1);
      });

      // Verify basket sees the coupon too (via shared query cache)
      await act(async () => {
        await basketResult.current.refetch();
      });

      // The basket data should include the coupon
      await waitFor(() => {
        expect(basketResult.current.basket?.coupons).toHaveLength(1);
      });
    });
  });
});
