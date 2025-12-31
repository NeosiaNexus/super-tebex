import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCategories } from '../../src/hooks/useCategories';
import { createWrapper } from '../utils/test-utils';

describe('useCategories', () => {
  it('should fetch categories successfully', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    // Initial loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.categories).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data
    expect(result.current.categories).not.toBeNull();
    expect(result.current.categories).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });

  it('should find category by name', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const vipCategory = result.current.getByName('VIP');
    expect(vipCategory).toBeDefined();
    expect(vipCategory?.id).toBe(1);

    const cosmeticsCategory = result.current.getByName('cosmetics');
    expect(cosmeticsCategory).toBeDefined();
    expect(cosmeticsCategory?.id).toBe(2);

    const unknownCategory = result.current.getByName('Unknown');
    expect(unknownCategory).toBeUndefined();
  });

  it('should find category by ID', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const category = result.current.getById(1);
    expect(category).toBeDefined();
    expect(category?.name).toBe('VIP');

    const unknownCategory = result.current.getById(999);
    expect(unknownCategory).toBeUndefined();
  });

  it('should respect enabled option', async () => {
    const { result } = renderHook(() => useCategories({ enabled: false }), {
      wrapper: createWrapper(),
    });

    // Should not fetch when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.categories).toBeNull();
  });

  it('should fetch categories without packages when includePackages is false', async () => {
    const { result } = renderHook(() => useCategories({ includePackages: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).not.toBeNull();
    // Categories should have empty packages array
    expect(result.current.categories?.[0]?.packages).toHaveLength(0);
  });
});
