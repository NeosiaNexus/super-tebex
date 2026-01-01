import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useGiftCards } from '../../src/hooks/useGiftCards';
import { useUser } from '../../src/hooks/useUser';
import { errorHandlers } from '../mocks/handlers';
import { server } from '../setup';
import { createWrapper, expectTebexError, TebexErrorCode, testConfig } from '../utils/test-utils';

describe('useGiftCards', () => {
  it('should start with empty gift cards', () => {
    const { result } = renderHook(() => useGiftCards(), {
      wrapper: createWrapper(),
    });

    expect(result.current.giftCards).toEqual([]);
    expect(result.current.isApplying).toBe(false);
    expect(result.current.isRemoving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });

  it('should throw error when applying gift card without basket', async () => {
    const { result } = renderHook(() => useGiftCards(), {
      wrapper: createWrapper(),
    });

    let thrownError: unknown = null;
    await act(async () => {
      try {
        await result.current.apply('CARD-1234');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).not.toBeNull();
    expectTebexError(thrownError, TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should throw error when removing gift card without basket', async () => {
    const { result } = renderHook(() => useGiftCards(), {
      wrapper: createWrapper(),
    });

    let thrownError: unknown = null;
    await act(async () => {
      try {
        await result.current.remove('CARD-1234');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).not.toBeNull();
    expectTebexError(thrownError, TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should apply gift card when basket exists', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Now test gift cards
    const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

    await act(async () => {
      await giftCardsResult.current.apply('GIFT-CARD-123');
    });

    // Verify gift card was actually applied
    await waitFor(() => {
      expect(giftCardsResult.current.giftCards).toHaveLength(1);
    });
    expect(giftCardsResult.current.giftCards[0].card_number).toBe('GIFT-CARD-123');
    expect(giftCardsResult.current.isApplying).toBe(false);
    expect(giftCardsResult.current.error).toBeNull();
  });

  it('should remove gift card when basket exists', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Now test gift cards
    const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

    // Apply then remove
    await act(async () => {
      await giftCardsResult.current.apply('GIFT-CARD-123');
    });

    await waitFor(() => {
      expect(giftCardsResult.current.giftCards).toHaveLength(1);
    });

    await act(async () => {
      await giftCardsResult.current.remove('GIFT-CARD-123');
    });

    // Verify gift card was actually removed
    await waitFor(() => {
      expect(giftCardsResult.current.giftCards).toHaveLength(0);
    });
    expect(giftCardsResult.current.isRemoving).toBe(false);
    expect(giftCardsResult.current.error).toBeNull();
  });

  it('should track applying state during apply mutation', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

    // Initial state
    expect(giftCardsResult.current.isApplying).toBe(false);

    // Apply gift card
    await act(async () => {
      await giftCardsResult.current.apply('GIFT-CARD-123');
    });

    // After completion
    expect(giftCardsResult.current.isApplying).toBe(false);
  });

  it('should track removing state during remove mutation', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

    // Initial state
    expect(giftCardsResult.current.isRemoving).toBe(false);

    // Remove gift card
    await act(async () => {
      await giftCardsResult.current.remove('GIFT-CARD-123');
    });

    // After completion
    expect(giftCardsResult.current.isRemoving).toBe(false);
  });

  // ============================================================================
  // NEW TESTS: onError callbacks and error handling
  // ============================================================================

  it('should call onError callback when apply gift card fails', async () => {
    const onError = vi.fn();
    const wrapper = createWrapper({ ...testConfig, onError });

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Override handler to return error
    server.use(errorHandlers.giftcardApply500);

    const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

    // Try to apply - should fail
    await act(async () => {
      try {
        await giftCardsResult.current.apply('FAIL-CARD');
      } catch {
        // Expected
      }
    });

    // Verify onError was called
    expect(onError).toHaveBeenCalledTimes(1);
    const errorArg = onError.mock.calls[0][0];
    expect(errorArg).toHaveProperty('code');
  });

  it('should call onError callback when remove gift card fails', async () => {
    const onError = vi.fn();
    const wrapper = createWrapper({ ...testConfig, onError });

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Override handler to return error
    server.use(errorHandlers.giftcardRemove500);

    const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

    // Try to remove - should fail
    await act(async () => {
      try {
        await giftCardsResult.current.remove('FAIL-CARD');
      } catch {
        // Expected
      }
    });

    // Verify onError was called
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('should populate error and errorCode when apply fails', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Override handler to return error
    server.use(errorHandlers.giftcardApply500);

    const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

    // Try to apply - should fail
    await act(async () => {
      try {
        await giftCardsResult.current.apply('FAIL');
      } catch {
        // Expected
      }
    });

    // Verify error state is populated
    await waitFor(() => {
      expect(giftCardsResult.current.error).not.toBeNull();
    });
    expect(giftCardsResult.current.errorCode).not.toBeNull();
  });

  it('should populate error and errorCode when remove fails', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Override handler to return error
    server.use(errorHandlers.giftcardRemove500);

    const { result: giftCardsResult } = renderHook(() => useGiftCards(), { wrapper });

    // Try to remove - should fail
    await act(async () => {
      try {
        await giftCardsResult.current.remove('FAIL');
      } catch {
        // Expected
      }
    });

    // Verify error state is populated
    await waitFor(() => {
      expect(giftCardsResult.current.error).not.toBeNull();
    });
    expect(giftCardsResult.current.errorCode).not.toBeNull();
  });
});
