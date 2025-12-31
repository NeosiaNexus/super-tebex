import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePackage } from '../../src/hooks/usePackage';
import { createWrapper } from '../utils/test-utils';

describe('usePackage', () => {
  it('should fetch a single package successfully', async () => {
    const { result } = renderHook(() => usePackage({ id: 101 }), {
      wrapper: createWrapper(),
    });

    // Initial loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.package).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data
    expect(result.current.package).not.toBeNull();
    expect(result.current.package?.id).toBe(101);
    expect(result.current.package?.name).toBe('VIP Gold');
    expect(result.current.package?.base_price).toBe(9.99);
    expect(result.current.error).toBeNull();
  });

  it('should handle non-existent package', async () => {
    const { result } = renderHook(() => usePackage({ id: 999 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have error for non-existent package
    expect(result.current.error).not.toBeNull();
  });

  it('should respect enabled option', async () => {
    const { result } = renderHook(() => usePackage({ id: 101, enabled: false }), {
      wrapper: createWrapper(),
    });

    // Should not fetch when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.package).toBeNull();
  });

  it('should provide data alias', async () => {
    const { result } = renderHook(() => usePackage({ id: 102 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // data should be the same as package
    expect(result.current.data).toBe(result.current.package);
    expect(result.current.data?.name).toBe('VIP Diamond');
  });
});
