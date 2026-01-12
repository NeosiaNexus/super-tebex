'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Category } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import type { UseCategoriesOptions, UseCategoriesReturn } from '../types/hooks';

/**
 * Hook to fetch all categories from the Tebex store.
 *
 * @param options - Configuration options
 * @returns Categories data and helper methods
 *
 * @example
 * ```tsx
 * const { categories, isLoading, getByName } = useCategories();
 *
 * if (isLoading) return <Spinner />;
 *
 * const vipCategory = getByName('VIP');
 * ```
 */
export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { includePackages = true, enabled = true } = options;

  const query = useQuery({
    queryKey: tebexKeys.categoriesList(includePackages),
    queryFn: async (): Promise<Category[]> => {
      const tebex = getTebexClient();
      return tebex.getCategories(includePackages);
    },
    enabled,
  });

  const error = useMemo(
    () => (query.error !== null ? TebexError.fromUnknown(query.error) : null),
    [query.error],
  );

  const getByName = useMemo(
    () => (name: string) =>
      query.data?.find(category => category.name.toLowerCase() === name.toLowerCase()),
    [query.data],
  );

  const getById = useMemo(
    () => (id: number) => query.data?.find(category => category.id === id),
    [query.data],
  );

  const getBySlug = useMemo(
    () => (slug: string) => query.data?.find(category => category.slug === slug),
    [query.data],
  );

  return {
    categories: query.data ?? null,
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error,
    errorCode: error?.code ?? null,
    refetch: query.refetch,
    getByName,
    getById,
    getBySlug,
  };
}
