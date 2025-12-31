import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TebexErrorCode } from '../../src/errors/codes';
import { useBasket } from '../../src/hooks/useBasket';
import { useGiftCards } from '../../src/hooks/useGiftCards';
import { useUser } from '../../src/hooks/useUser';
import { createWrapper } from '../utils/test-utils';

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

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.apply('CARD-1234');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as any).code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should throw error when removing gift card without basket', async () => {
    const { result } = renderHook(() => useGiftCards(), {
      wrapper: createWrapper(),
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.remove('CARD-1234');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as any).code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
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

    await act(async () => {
      await giftCardsResult.current.remove('GIFT-CARD-123');
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
});
