'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Package } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import type { UsePackageOptions, UsePackageReturn } from '../types/hooks';

/**
 * Hook to fetch a single package by ID.
 *
 * @param options - Configuration options including the package ID
 * @returns Package data
 *
 * @example
 * ```tsx
 * const { package: pkg, isLoading } = usePackage({ id: 123 });
 *
 * if (isLoading) return <Spinner />;
 * if (!pkg) return <NotFound />;
 *
 * return <PackageDisplay package={pkg} />;
 * ```
 */
export function usePackage(options: UsePackageOptions): UsePackageReturn {
  const { id, enabled = true } = options;

  const query = useQuery({
    queryKey: tebexKeys.package(id),
    queryFn: async (): Promise<Package> => {
      const tebex = getTebexClient();
      return tebex.getPackage(id);
    },
    enabled,
  });

  const error = useMemo(
    () => (query.error !== null ? TebexError.fromUnknown(query.error) : null),
    [query.error],
  );

  return {
    package: query.data ?? null,
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error,
    errorCode: error?.code ?? null,
    refetch: query.refetch,
  };
}
