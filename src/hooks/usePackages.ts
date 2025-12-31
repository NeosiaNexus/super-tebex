'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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

      // If categoryId is provided, get packages from that category
      if (categoryId !== undefined) {
        const category = await tebex.getCategory(categoryId);
        return category.packages;
      }

      // Otherwise, get all packages from all categories
      const categories = await tebex.getCategories(true);
      const allPackages: Package[] = [];

      for (const category of categories) {
        allPackages.push(...category.packages);
      }

      return allPackages;
    },
    enabled,
  });

  const error = useMemo(
    () => (query.error !== null ? TebexError.fromUnknown(query.error) : null),
    [query.error],
  );

  const getById = useMemo(
    () => (id: number) => query.data?.find(pkg => pkg.id === id),
    [query.data],
  );

  const getByName = useMemo(
    () => (name: string) => query.data?.find(pkg => pkg.name.toLowerCase() === name.toLowerCase()),
    [query.data],
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
