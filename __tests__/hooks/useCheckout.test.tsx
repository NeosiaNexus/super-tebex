import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TebexErrorCode } from '../../src/errors/codes';
import { useBasket } from '../../src/hooks/useBasket';
import { useCheckout } from '../../src/hooks/useCheckout';
import { useUser } from '../../src/hooks/useUser';
import { createWrapper, testConfig } from '../utils/test-utils';

/**
 * Creates a mock Tebex checkout that captures event handlers
 * and allows triggering them programmatically
 */
function createMockTebexCheckout() {
  const eventHandlers: Record<string, ((data?: unknown) => void)[]> = {};

  return {
    checkout: {
      init: vi.fn(),
      launch: vi.fn(),
      close: vi.fn(),
      on: vi.fn((event: string, callback: (data?: unknown) => void) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(callback);
      }),
    },
    // Helper to trigger events in tests
    triggerEvent: (event: string, data?: unknown) => {
      const handlers = eventHandlers[event];
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    },
    getEventHandlers: () => eventHandlers,
  };
}

describe('useCheckout', () => {
  beforeEach(() => {
    vi.stubGlobal('Tebex', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start with canCheckout as false when no basket', () => {
    const { result } = renderHook(() => useCheckout(), {
      wrapper: createWrapper(),
    });

    expect(result.current.canCheckout).toBe(false);
    expect(result.current.isLaunching).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
    expect(result.current.checkoutUrl).toBeNull();
  });

  it('should have launch function available', () => {
    const { result } = renderHook(() => useCheckout(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.launch).toBe('function');
  });

  it('should accept checkout options', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() => useCheckout({ onSuccess, onError, onClose }), {
      wrapper: createWrapper(),
    });

    expect(result.current.canCheckout).toBe(false);
    expect(result.current.isLaunching).toBe(false);
  });

  it('should throw BASKET_NOT_FOUND error when launching without basket', async () => {
    const { result } = renderHook(() => useCheckout(), {
      wrapper: createWrapper(),
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.launch();
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as unknown as { code: TebexErrorCode }).code).toBe(
      TebexErrorCode.BASKET_NOT_FOUND,
    );
  });

  it('should have errorCode null when no error', () => {
    const { result } = renderHook(() => useCheckout(), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });

  it('should throw TEBEX_JS_NOT_LOADED error when Tebex.js is not loaded', async () => {
    const wrapper = createWrapper();

    // Set up user and basket first
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Tebex is undefined (not loaded)
    const { result: checkoutResult } = renderHook(() => useCheckout(), { wrapper });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await checkoutResult.current.launch();
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as unknown as { code: TebexErrorCode }).code).toBe(
      TebexErrorCode.TEBEX_JS_NOT_LOADED,
    );
  });

  it('should throw BASKET_EMPTY error when basket has no packages', async () => {
    const wrapper = createWrapper();
    const mockTebex = createMockTebexCheckout();
    vi.stubGlobal('Tebex', mockTebex);

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add then remove package to have an empty basket with a valid ident
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    await act(async () => {
      await basketResult.current.removePackage(101);
    });

    await waitFor(() => {
      expect(basketResult.current.isEmpty).toBe(true);
    });

    const { result: checkoutResult } = renderHook(() => useCheckout(), { wrapper });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await checkoutResult.current.launch();
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as unknown as { code: TebexErrorCode }).code).toBe(
      TebexErrorCode.BASKET_EMPTY,
    );
  });

  it('should call onSuccess and clearBasket on payment:complete', async () => {
    const wrapper = createWrapper();
    const mockTebex = createMockTebexCheckout();
    vi.stubGlobal('Tebex', mockTebex);

    // Set up user and basket with a package
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
      expect(basketResult.current.isEmpty).toBe(false);
    });

    const onSuccess = vi.fn();
    const { result: checkoutResult } = renderHook(() => useCheckout({ onSuccess }), { wrapper });

    // Start launch (don't await - it won't resolve until event fires)
    let launchPromise: Promise<void> | null = null;
    act(() => {
      launchPromise = checkoutResult.current.launch();
    });

    // Wait for Tebex to be initialized
    await waitFor(() => {
      expect(mockTebex.checkout.init).toHaveBeenCalled();
    });
    expect(mockTebex.checkout.launch).toHaveBeenCalled();

    // Trigger payment:complete event
    await act(async () => {
      mockTebex.triggerEvent('payment:complete');
      await launchPromise;
    });

    // Verify onSuccess was called
    expect(onSuccess).toHaveBeenCalledTimes(1);

    // Verify basket was cleared
    expect(basketResult.current.basketIdent).toBeNull();
  });

  it('should call onError on payment:error', async () => {
    const wrapper = createWrapper();
    const mockTebex = createMockTebexCheckout();
    vi.stubGlobal('Tebex', mockTebex);

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
      expect(basketResult.current.isEmpty).toBe(false);
    });

    const onError = vi.fn();
    const { result: checkoutResult } = renderHook(() => useCheckout({ onError }), { wrapper });

    // Start launch
    act(() => {
      void checkoutResult.current.launch().catch(() => {
        // Expected to throw
      });
    });

    // Wait for Tebex to be initialized
    await waitFor(() => {
      expect(mockTebex.checkout.init).toHaveBeenCalled();
    });

    // Trigger payment:error event
    act(() => {
      mockTebex.triggerEvent('payment:error', { message: 'Payment declined' });
    });

    // Wait for the error to be processed
    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });

    // Verify error was passed to callback
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: TebexErrorCode.CHECKOUT_FAILED,
      }),
    );
  });

  it('should call onClose when checkout modal is closed', async () => {
    const wrapper = createWrapper();
    const mockTebex = createMockTebexCheckout();
    vi.stubGlobal('Tebex', mockTebex);

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
      expect(basketResult.current.isEmpty).toBe(false);
    });

    const onClose = vi.fn();
    const { result: checkoutResult } = renderHook(() => useCheckout({ onClose }), { wrapper });

    // Start launch
    act(() => {
      void checkoutResult.current.launch();
    });

    // Wait for Tebex to be initialized
    await waitFor(() => {
      expect(mockTebex.checkout.init).toHaveBeenCalled();
    });

    // Trigger close event
    act(() => {
      mockTebex.triggerEvent('close');
    });

    // Verify onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should initialize Tebex.checkout with basket ident', async () => {
    const wrapper = createWrapper();
    const mockTebex = createMockTebexCheckout();
    vi.stubGlobal('Tebex', mockTebex);

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
      expect(basketResult.current.isEmpty).toBe(false);
    });

    const basketIdent = basketResult.current.basketIdent;
    const { result: checkoutResult } = renderHook(() => useCheckout(), { wrapper });

    // Start launch
    act(() => {
      void checkoutResult.current.launch();
    });

    // Wait for Tebex to be initialized
    await waitFor(() => {
      expect(mockTebex.checkout.init).toHaveBeenCalled();
    });

    // Verify init was called with correct ident
    expect(mockTebex.checkout.init).toHaveBeenCalledWith({ ident: basketIdent });
  });

  it('should have canCheckout true when basket has packages', async () => {
    const wrapper = createWrapper();

    // Set up user and basket with a package
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
      expect(basketResult.current.isEmpty).toBe(false);
    });

    const { result: checkoutResult } = renderHook(() => useCheckout(), { wrapper });

    await waitFor(() => {
      expect(checkoutResult.current.canCheckout).toBe(true);
    });
  });

  it('should have checkoutUrl from basket links', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    const { result: checkoutResult } = renderHook(() => useCheckout(), { wrapper });

    await waitFor(() => {
      expect(checkoutResult.current.checkoutUrl).not.toBeNull();
    });

    expect(checkoutResult.current.checkoutUrl).toContain('checkout.tebex.io');
  });

  it('should call global onError from config on payment:error', async () => {
    const globalOnError = vi.fn();
    const wrapper = createWrapper({ ...testConfig, onError: globalOnError });
    const mockTebex = createMockTebexCheckout();
    vi.stubGlobal('Tebex', mockTebex);

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
      expect(basketResult.current.isEmpty).toBe(false);
    });

    const { result: checkoutResult } = renderHook(() => useCheckout(), { wrapper });

    // Start launch
    act(() => {
      void checkoutResult.current.launch().catch(() => {
        // Expected to throw
      });
    });

    // Wait for Tebex to be initialized
    await waitFor(() => {
      expect(mockTebex.checkout.init).toHaveBeenCalled();
    });

    // Trigger payment:error
    act(() => {
      mockTebex.triggerEvent('payment:error', 'Card declined');
    });

    await waitFor(() => {
      expect(globalOnError).toHaveBeenCalledTimes(1);
    });
  });
});
