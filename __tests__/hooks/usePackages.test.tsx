import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePackages } from '../../src/hooks/usePackages';
import { errorHandlers } from '../mocks/handlers';
import { server } from '../setup';
import { createWrapper, TebexErrorCode } from '../utils/test-utils';

describe('usePackages', () => {
  it('should fetch all packages successfully', async () => {
    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    // Initial loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.packages).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data - should have all packages from all categories
    expect(result.current.packages).not.toBeNull();
    expect(result.current.packages).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it('should filter packages by category', async () => {
    const { result } = renderHook(() => usePackages({ categoryId: 1 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only have packages from category 1 (VIP)
    expect(result.current.packages).not.toBeNull();
    expect(result.current.packages).toHaveLength(2);
    expect(result.current.packages?.[0]?.name).toBe('VIP Gold');
    expect(result.current.packages?.[1]?.name).toBe('VIP Diamond');
  });

  it('should find package by id', async () => {
    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const pkg = result.current.getById(101);
    expect(pkg?.name).toBe('VIP Gold');
    expect(pkg?.base_price).toBe(9.99);
  });

  it('should find package by name', async () => {
    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const pkg = result.current.getByName('vip diamond');
    expect(pkg?.id).toBe(102);
    expect(pkg?.base_price).toBe(19.99);
  });

  it('should respect enabled option', async () => {
    const { result } = renderHook(() => usePackages({ enabled: false }), {
      wrapper: createWrapper(),
    });

    // Should not fetch when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.packages).toBeNull();
  });

  // ============================================================================
  // NEW TESTS: Error handling
  // ============================================================================

  it('should handle fetch error and provide error code', async () => {
    // usePackages uses getCategories internally, so we need to override that
    server.use(errorHandlers.categories500);

    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify error is populated
    expect(result.current.error).not.toBeNull();
    expect(result.current.errorCode).toBe(TebexErrorCode.UNKNOWN);
    expect(result.current.packages).toBeNull();
  });

  it('should have refetch function', async () => {
    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify refetch is available
    expect(typeof result.current.refetch).toBe('function');
  });
});
