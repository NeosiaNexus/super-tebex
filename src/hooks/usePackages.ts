'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import type { Package } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import type { UsePackagesOptions, UsePackagesReturn } from '../types/hooks';

/**
 * Hook to fetch all packages from the Tebex store.
 * Optionally filter by category.
 *
 * @param options - Configuration options
 * @returns Packages data and helper methods
 *
 * @example
 * ```tsx
 * const { packages, isLoading, getById } = usePackages();
 *
 * // Or filter by category
 * const { packages } = usePackages({ categoryId: 123 });
 * ```
 */
export function usePackages(options: UsePackagesOptions = {}): UsePackagesReturn {
  const { categoryId, enabled = true } = options;

  const query = useQuery({
    queryKey: tebexKeys.packagesList(categoryId),
    queryFn: async (): Promise<Package[]> => {
      const tebex = getTebexClient();

      if (categoryId !== undefined) {
        const category = await tebex.getCategory(categoryId);
        return category.packages;
      }

      const categories = await tebex.getCategories(true);
      const allPackages: Package[] = [];

      for (const category of categories) {
        allPackages.push(...category.packages);
      }

      return allPackages;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const error = useMemo(
    () => (query.error !== null ? TebexError.fromUnknown(query.error) : null),
    [query.error],
  );

  const dataRef = useRef(query.data);
  dataRef.current = query.data;

  const getById = useCallback(
    (id: number) => dataRef.current?.find(pkg => pkg.id === id),
    [],
  );

  const getByName = useCallback(
    (name: string) =>
      dataRef.current?.find(pkg => pkg.name.toLowerCase() === name.toLowerCase()),
    [],
  );

  return {
    packages: query.data ?? null,
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error,
    errorCode: error?.code ?? null,
    refetch: query.refetch,
    getById,
    getByName,
  };
}
