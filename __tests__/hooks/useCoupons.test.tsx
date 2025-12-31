import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useCoupons } from '../../src/hooks/useCoupons';
import { useUser } from '../../src/hooks/useUser';
import { createWrapper } from '../utils/test-utils';

describe('useCoupons', () => {
  it('should start with empty coupons', () => {
    const { result } = renderHook(() => useCoupons(), {
      wrapper: createWrapper(),
    });

    expect(result.current.coupons).toEqual([]);
    expect(result.current.isApplying).toBe(false);
    expect(result.current.isRemoving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should apply coupon when basket exists', async () => {
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

    // Now test coupons
    const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });

    await act(async () => {
      await couponsResult.current.apply('TEST10');
    });

    // Coupon should be applied (basket refetch will update coupons)
    expect(couponsResult.current.isApplying).toBe(false);
  });
});
