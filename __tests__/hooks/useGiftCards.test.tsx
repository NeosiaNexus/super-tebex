import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
  });
});
