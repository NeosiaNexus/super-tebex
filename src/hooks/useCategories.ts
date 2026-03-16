'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
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
    staleTime: 5 * 60 * 1000,
  });

  const error = useMemo(
    () => (query.error !== null ? TebexError.fromUnknown(query.error) : null),
    [query.error],
  );

  const dataRef = useRef(query.data);
  dataRef.current = query.data;

  const getByName = useCallback(
    (name: string) =>
      dataRef.current?.find(category => category.name.toLowerCase() === name.toLowerCase()),
    [],
  );

  const getById = useCallback(
    (id: number) => dataRef.current?.find(category => category.id === id),
    [],
  );

  const getBySlug = useCallback(
    (slug: string) => dataRef.current?.find(category => category.slug === slug),
    [],
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
