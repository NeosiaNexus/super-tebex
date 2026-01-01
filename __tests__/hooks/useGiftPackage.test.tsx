import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useGiftPackage } from '../../src/hooks/useGiftPackage';
import { useUser } from '../../src/hooks/useUser';
import { errorHandlers } from '../mocks/handlers';
import { server } from '../setup';
import { createWrapper, expectTebexError, TebexErrorCode, testConfig } from '../utils/test-utils';

describe('useGiftPackage', () => {
  it('should start with initial state', () => {
    const { result } = renderHook(() => useGiftPackage(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isGifting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });

  it('should require authentication to gift', async () => {
    const { result } = renderHook(() => useGiftPackage(), {
      wrapper: createWrapper(),
    });

    // Try to gift without authentication
    let thrownError: unknown = null;
    await act(async () => {
      try {
        await result.current.gift({
          packageId: 101,
          targetUsername: 'FriendPlayer',
        });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).not.toBeNull();
    expectTebexError(thrownError, TebexErrorCode.NOT_AUTHENTICATED);
  });

  it('should gift package when authenticated (creates new basket)', async () => {
    const wrapper = createWrapper();

    // Set up user
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    await waitFor(() => {
      expect(userResult.current.isAuthenticated).toBe(true);
    });

    // Now test gift package - this creates a new basket
    const { result: giftResult } = renderHook(() => useGiftPackage(), { wrapper });

    await act(async () => {
      await giftResult.current.gift({
        packageId: 101,
        targetUsername: 'FriendPlayer',
        quantity: 1,
      });
    });

    expect(giftResult.current.isGifting).toBe(false);
    expect(giftResult.current.error).toBeNull();
  });

  it('should gift package to existing basket', async () => {
    const wrapper = createWrapper();

    // Set up user
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    // Create a basket first by adding a regular package
    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    const existingBasketIdent = basketResult.current.basketIdent;

    // Now gift to the existing basket
    const { result: giftResult } = renderHook(() => useGiftPackage(), { wrapper });

    await act(async () => {
      await giftResult.current.gift({
        packageId: 102,
        targetUsername: 'FriendPlayer',
        quantity: 1,
      });
    });

    // Should still be the same basket (not create a new one)
    expect(basketResult.current.basketIdent).toBe(existingBasketIdent);
    expect(giftResult.current.isGifting).toBe(false);
    expect(giftResult.current.error).toBeNull();
  });

  it('should call onError callback when gift fails', async () => {
    const onError = vi.fn();
    const wrapper = createWrapper({ ...testConfig, onError });

    // Set up user
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    // Create a basket first
    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Override handler to return error for add package
    server.use(errorHandlers.addPackage500);

    const { result: giftResult } = renderHook(() => useGiftPackage(), { wrapper });

    // Try to gift - should fail
    await act(async () => {
      try {
        await giftResult.current.gift({
          packageId: 999,
          targetUsername: 'FriendPlayer',
        });
      } catch {
        // Expected
      }
    });

    // Verify onError was called
    expect(onError).toHaveBeenCalledTimes(1);
    const errorArg = onError.mock.calls[0][0];
    expect(errorArg).toHaveProperty('code');
  });

  it('should populate error and errorCode when gift fails', async () => {
    const wrapper = createWrapper();

    // Set up user
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    // Create a basket first
    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Override handler to return error
    server.use(errorHandlers.addPackage500);

    const { result: giftResult } = renderHook(() => useGiftPackage(), { wrapper });

    // Try to gift - should fail
    await act(async () => {
      try {
        await giftResult.current.gift({
          packageId: 999,
          targetUsername: 'FriendPlayer',
        });
      } catch {
        // Expected
      }
    });

    // Verify error state is populated
    await waitFor(() => {
      expect(giftResult.current.error).not.toBeNull();
    });
    expect(giftResult.current.errorCode).not.toBeNull();
  });

  it('should handle gift with default quantity', async () => {
    const wrapper = createWrapper();

    // Set up user
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    await waitFor(() => {
      expect(userResult.current.isAuthenticated).toBe(true);
    });

    const { result: giftResult } = renderHook(() => useGiftPackage(), { wrapper });

    // Gift without specifying quantity (should default to 1)
    await act(async () => {
      await giftResult.current.gift({
        packageId: 101,
        targetUsername: 'FriendPlayer',
      });
    });

    expect(giftResult.current.isGifting).toBe(false);
    expect(giftResult.current.error).toBeNull();
  });
});
