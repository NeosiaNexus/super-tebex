import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCategory } from '../../src/hooks/useCategory';
import { createWrapper } from '../utils/test-utils';

describe('useCategory', () => {
  it('should fetch a single category successfully', async () => {
    const { result } = renderHook(() => useCategory({ id: 1 }), {
      wrapper: createWrapper(),
    });

    // Initial loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.category).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data
    expect(result.current.category).not.toBeNull();
    expect(result.current.category?.id).toBe(1);
    expect(result.current.category?.name).toBe('VIP');
    expect(result.current.error).toBeNull();
  });

  it('should handle non-existent category', async () => {
    const { result } = renderHook(() => useCategory({ id: 999 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have error for non-existent category
    expect(result.current.error).not.toBeNull();
  });

  it('should respect enabled option', async () => {
    const { result } = renderHook(() => useCategory({ id: 1, enabled: false }), {
      wrapper: createWrapper(),
    });

    // Should not fetch when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.category).toBeNull();
  });

  it('should provide data alias', async () => {
    const { result } = renderHook(() => useCategory({ id: 2 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // data should be the same as category
    expect(result.current.data).toBe(result.current.category);
    expect(result.current.data?.name).toBe('Cosmetics');
  });
});
