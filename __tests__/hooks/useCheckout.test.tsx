import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCheckout } from '../../src/hooks/useCheckout';
import { createWrapper } from '../utils/test-utils';

describe('useCheckout', () => {
  beforeEach(() => {
    // Reset Tebex mock
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
});
