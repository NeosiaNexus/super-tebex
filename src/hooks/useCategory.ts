'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Category } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import type { UseCategoryOptions, UseCategoryReturn } from '../types/hooks';

/**
 * Hook to fetch a single category by ID.
 *
 * @param options - Configuration options including the category ID
 * @returns Category data
 *
 * @example
 * ```tsx
 * const { category, isLoading } = useCategory({ id: 123 });
 *
 * if (isLoading) return <Spinner />;
 * if (!category) return <NotFound />;
 *
 * return <CategoryDisplay category={category} />;
 * ```
 */
export function useCategory(options: UseCategoryOptions): UseCategoryReturn {
  const { id, enabled = true } = options;

  const query = useQuery({
    queryKey: tebexKeys.category(id),
    queryFn: async (): Promise<Category> => {
      const tebex = getTebexClient();
      return tebex.getCategory(id);
    },
    enabled,
  });

  const error = useMemo(
    () => (query.error !== null ? TebexError.fromUnknown(query.error) : null),
    [query.error],
  );

  return {
    category: query.data ?? null,
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error,
    errorCode: error?.code ?? null,
    refetch: query.refetch,
  };
}
