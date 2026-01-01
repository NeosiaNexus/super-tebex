import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useCreatorCodes } from '../../src/hooks/useCreatorCodes';
import { useUser } from '../../src/hooks/useUser';
import { errorHandlers } from '../mocks/handlers';
import { server } from '../setup';
import { createWrapper, expectTebexError, TebexErrorCode, testConfig } from '../utils/test-utils';

describe('useCreatorCodes', () => {
  it('should start with no creator code', () => {
    const { result } = renderHook(() => useCreatorCodes(), {
      wrapper: createWrapper(),
    });

    expect(result.current.creatorCode).toBeNull();
    expect(result.current.isApplying).toBe(false);
    expect(result.current.isRemoving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });

  it('should throw error when applying creator code without basket', async () => {
    const { result } = renderHook(() => useCreatorCodes(), {
      wrapper: createWrapper(),
    });

    let thrownError: unknown = null;
    await act(async () => {
      try {
        await result.current.apply('CREATOR123');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).not.toBeNull();
    expectTebexError(thrownError, TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should throw error when removing creator code without basket', async () => {
    const { result } = renderHook(() => useCreatorCodes(), {
      wrapper: createWrapper(),
    });

    let thrownError: unknown = null;
    await act(async () => {
      try {
        await result.current.remove();
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).not.toBeNull();
    expectTebexError(thrownError, TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should apply creator code when basket exists', async () => {
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

    // Now test creator codes
    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    await act(async () => {
      await creatorCodesResult.current.apply('CREATOR123');
    });

    // Verify creator code was actually applied
    await waitFor(() => {
      expect(creatorCodesResult.current.creatorCode).toBe('CREATOR123');
    });
    expect(creatorCodesResult.current.isApplying).toBe(false);
    expect(creatorCodesResult.current.error).toBeNull();
  });

  it('should remove creator code when basket exists', async () => {
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

    // Now test creator codes
    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Apply then remove
    await act(async () => {
      await creatorCodesResult.current.apply('CREATOR123');
    });

    await waitFor(() => {
      expect(creatorCodesResult.current.creatorCode).toBe('CREATOR123');
    });

    await act(async () => {
      await creatorCodesResult.current.remove();
    });

    // Verify creator code was actually removed
    await waitFor(() => {
      expect(creatorCodesResult.current.creatorCode).toBeNull();
    });
    expect(creatorCodesResult.current.isRemoving).toBe(false);
    expect(creatorCodesResult.current.error).toBeNull();
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

    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Initial state
    expect(creatorCodesResult.current.isApplying).toBe(false);

    // Apply creator code
    await act(async () => {
      await creatorCodesResult.current.apply('CREATOR123');
    });

    // After completion
    expect(creatorCodesResult.current.isApplying).toBe(false);
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

    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Initial state
    expect(creatorCodesResult.current.isRemoving).toBe(false);

    // Remove creator code
    await act(async () => {
      await creatorCodesResult.current.remove();
    });

    // After completion
    expect(creatorCodesResult.current.isRemoving).toBe(false);
  });

  // ============================================================================
  // NEW TESTS: onError callbacks and error handling
  // ============================================================================

  it('should call onError callback when apply creator code fails', async () => {
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
    server.use(errorHandlers.creatorCodeApply500);

    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Try to apply - should fail
    await act(async () => {
      try {
        await creatorCodesResult.current.apply('FAIL');
      } catch {
        // Expected
      }
    });

    // Verify onError was called
    expect(onError).toHaveBeenCalledTimes(1);
    const errorArg = onError.mock.calls[0][0];
    expect(errorArg).toHaveProperty('code');
  });

  it('should call onError callback when remove creator code fails', async () => {
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
    server.use(errorHandlers.creatorCodeRemove500);

    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Try to remove - should fail
    await act(async () => {
      try {
        await creatorCodesResult.current.remove();
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
    server.use(errorHandlers.creatorCodeApply500);

    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Try to apply - should fail
    await act(async () => {
      try {
        await creatorCodesResult.current.apply('FAIL');
      } catch {
        // Expected
      }
    });

    // Verify error state is populated
    await waitFor(() => {
      expect(creatorCodesResult.current.error).not.toBeNull();
    });
    expect(creatorCodesResult.current.errorCode).not.toBeNull();
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
    server.use(errorHandlers.creatorCodeRemove500);

    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Try to remove - should fail
    await act(async () => {
      try {
        await creatorCodesResult.current.remove();
      } catch {
        // Expected
      }
    });

    // Verify error state is populated
    await waitFor(() => {
      expect(creatorCodesResult.current.error).not.toBeNull();
    });
    expect(creatorCodesResult.current.errorCode).not.toBeNull();
  });
});
