import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCheckout } from '../../src/hooks/useCheckout';
import { TebexErrorCode } from '../../src/errors/codes';
import { createWrapper } from '../utils/test-utils';

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
    expect((thrownError as any).code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should have errorCode null when no error', () => {
    const { result } = renderHook(() => useCheckout(), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });
});
