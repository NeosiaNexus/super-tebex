import { act, renderHook } from '@testing-library/react';
import type { Category } from 'tebex_headless';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/categoriesService', () => ({
  default: {
    getCategories: vi.fn(),
  },
}));

import useCategories from '../../hook/useCategories';
import categoriesService from '../../services/categoriesService';
import type { GetCategories } from '../../types';

const mockedGetCategories = categoriesService.getCategories as unknown as vi.Mock;

describe('useCategories', () => {
  const options: GetCategories = { includePackages: true };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads categories and exposes them (success path)', async () => {
    const fakeCategories: Category[] = [
      { id: 1, name: 'Ranks' } as Category,
      { id: 2, name: 'Kits' } as Category,
    ];

    mockedGetCategories.mockResolvedValue(fakeCategories);

    const { result } = renderHook(() => useCategories(options));

    expect(result.current.loading).toBe(true);
    expect(result.current.categories).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedGetCategories).toHaveBeenCalledWith(options);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.categories).toEqual(fakeCategories);

    expect(result.current.getByName('ranks')).toEqual(fakeCategories[0]);
    expect(result.current.getByName('RANKS')).toEqual(fakeCategories[0]);
    expect(result.current.getByName('unknown')).toBeUndefined();

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockedGetCategories).toHaveBeenCalledTimes(2);
  });

  it('sets error and clears categories when service throws', async () => {
    mockedGetCategories.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCategories(options));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.categories).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('reacts to options change by refetching with new options', async () => {
    const firstCategories: Category[] = [{ id: 1, name: 'First' } as Category];
    const secondCategories: Category[] = [{ id: 2, name: 'Second' } as Category];

    mockedGetCategories
      .mockResolvedValueOnce(firstCategories) // premier useEffect
      .mockResolvedValueOnce(secondCategories); // useEffect après changement d’options

    const { result, rerender } = renderHook(props => useCategories(props), {
      initialProps: { includePackages: false } as GetCategories,
    });

    // Laisser le premier fetch se terminer
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.categories).toEqual(firstCategories);

    // Changement d'options => nouveau fetch via useEffect/useCallback
    rerender({ includePackages: true });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedGetCategories).toHaveBeenCalledTimes(2);
    expect(mockedGetCategories).toHaveBeenNthCalledWith(1, { includePackages: false });
    expect(mockedGetCategories).toHaveBeenNthCalledWith(2, { includePackages: true });
    expect(result.current.categories).toEqual(secondCategories);
  });
});
