import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TebexErrorCode } from '../../src/errors/codes';
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
    expect(result.current.errorCode).toBeNull();
  });

  it('should throw error when applying coupon without basket', async () => {
    const { result } = renderHook(() => useCoupons(), {
      wrapper: createWrapper(),
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.apply('TEST10');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as any).code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should throw error when removing coupon without basket', async () => {
    const { result } = renderHook(() => useCoupons(), {
      wrapper: createWrapper(),
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.remove('TEST10');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as any).code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
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
    expect(couponsResult.current.error).toBeNull();
  });

  it('should remove coupon when basket exists', async () => {
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

    // Apply then remove
    await act(async () => {
      await couponsResult.current.apply('TEST10');
    });

    await act(async () => {
      await couponsResult.current.remove('TEST10');
    });

    expect(couponsResult.current.isRemoving).toBe(false);
    expect(couponsResult.current.error).toBeNull();
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

    const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });

    // Initial state
    expect(couponsResult.current.isApplying).toBe(false);

    // Apply coupon
    await act(async () => {
      await couponsResult.current.apply('TEST10');
    });

    // After completion
    expect(couponsResult.current.isApplying).toBe(false);
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

    const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });

    // Initial state
    expect(couponsResult.current.isRemoving).toBe(false);

    // Remove coupon
    await act(async () => {
      await couponsResult.current.remove('TEST10');
    });

    // After completion
    expect(couponsResult.current.isRemoving).toBe(false);
  });
});
