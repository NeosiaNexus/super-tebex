import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useCoupons } from '../../src/hooks/useCoupons';
import { useUser } from '../../src/hooks/useUser';
import { errorHandlers } from '../mocks/handlers';
import { server } from '../setup';
import { createWrapper, expectTebexError, TebexErrorCode, testConfig } from '../utils/test-utils';

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

    let thrownError: unknown = null;
    await act(async () => {
      try {
        await result.current.apply('TEST10');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).not.toBeNull();
    expectTebexError(thrownError, TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should throw error when removing coupon without basket', async () => {
    const { result } = renderHook(() => useCoupons(), {
      wrapper: createWrapper(),
    });

    let thrownError: unknown = null;
    await act(async () => {
      try {
        await result.current.remove('TEST10');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).not.toBeNull();
    expectTebexError(thrownError, TebexErrorCode.BASKET_NOT_FOUND);
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

    // Verify coupon was actually applied
    await waitFor(() => {
      expect(couponsResult.current.coupons).toHaveLength(1);
    });
    expect(couponsResult.current.coupons[0].code).toBe('TEST10');
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

    await waitFor(() => {
      expect(couponsResult.current.coupons).toHaveLength(1);
    });

    await act(async () => {
      await couponsResult.current.remove('TEST10');
    });

    // Verify coupon was actually removed
    await waitFor(() => {
      expect(couponsResult.current.coupons).toHaveLength(0);
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

  // ============================================================================
  // NEW TESTS: onError callbacks and error handling
  // ============================================================================

  it('should call onError callback when apply coupon fails', async () => {
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
    server.use(errorHandlers.couponApply500);

    const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });

    // Try to apply - should fail
    await act(async () => {
      try {
        await couponsResult.current.apply('TEST10');
      } catch {
        // Expected
      }
    });

    // Verify onError was called
    expect(onError).toHaveBeenCalledTimes(1);
    const errorArg = onError.mock.calls[0][0];
    expect(errorArg).toHaveProperty('code');
  });

  it('should call onError callback when remove coupon fails', async () => {
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
    server.use(errorHandlers.couponRemove500);

    const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });

    // Try to remove - should fail
    await act(async () => {
      try {
        await couponsResult.current.remove('TEST10');
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
    server.use(errorHandlers.couponApply500);

    const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });

    // Try to apply - should fail
    await act(async () => {
      try {
        await couponsResult.current.apply('FAIL');
      } catch {
        // Expected
      }
    });

    // Verify error state is populated
    await waitFor(() => {
      expect(couponsResult.current.error).not.toBeNull();
    });
    expect(couponsResult.current.errorCode).not.toBeNull();
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
    server.use(errorHandlers.couponRemove500);

    const { result: couponsResult } = renderHook(() => useCoupons(), { wrapper });

    // Try to remove - should fail
    await act(async () => {
      try {
        await couponsResult.current.remove('FAIL');
      } catch {
        // Expected
      }
    });

    // Verify error state is populated
    await waitFor(() => {
      expect(couponsResult.current.error).not.toBeNull();
    });
    expect(couponsResult.current.errorCode).not.toBeNull();
  });
});
