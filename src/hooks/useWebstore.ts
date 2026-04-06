'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Webstore } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import type { UseWebstoreReturn, WebstoreData } from '../types/hooks';

/**
 * Currency object as returned by the actual Tebex API (differs from type definition).
 */
interface CurrencyObject {
  readonly iso_4217: string;
  readonly symbol: string;
}

/**
 * Type guard for currency objects returned by the Tebex API.
 */
function isCurrencyObject(value: unknown): value is CurrencyObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    'iso_4217' in value &&
    typeof (value as { iso_4217: unknown }).iso_4217 === 'string'
  );
}

/**
 * Transforms the Tebex Webstore response to our WebstoreData type.
 */
function transformWebstore(webstore: Webstore): WebstoreData {
  const rawCurrency: unknown = webstore.currency;
  let currencyCode: string;
  if (isCurrencyObject(rawCurrency)) {
    currencyCode = rawCurrency.iso_4217;
  } else if (typeof rawCurrency === 'string') {
    currencyCode = rawCurrency;
  } else {
    currencyCode = 'USD';
  }

  return {
    id: webstore.id,
    name: webstore.name,
    description: webstore.description,
    currency: currencyCode,
    domain: webstore.webstore_url,
    logo: typeof webstore.logo === 'string' && webstore.logo.length > 0 ? webstore.logo : null,
  };
}

/**
 * Hook to fetch webstore information.
 *
 * @returns Webstore data including name, currency, and domain
 *
 * @example
 * ```tsx
 * const { webstore, currency, isLoading } = useWebstore();
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <div>
 *     <h1>{webstore?.name}</h1>
 *     <p>Currency: {currency}</p>
 *   </div>
 * );
 * ```
 */
export function useWebstore(): UseWebstoreReturn {
  const query = useQuery({
    queryKey: tebexKeys.webstore(),
    queryFn: async (): Promise<WebstoreData> => {
      const tebex = getTebexClient();
      const webstore = await tebex.getWebstore();
      return transformWebstore(webstore);
    },
    staleTime: 5 * 60 * 1000,
  });

  const error = useMemo(
    () => (query.error !== null ? TebexError.fromUnknown(query.error) : null),
    [query.error],
  );

  return {
    webstore: query.data ?? null,
    data: query.data ?? null,
    name: query.data?.name ?? null,
    currency: query.data?.currency ?? null,
    domain: query.data?.domain ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error,
    errorCode: error?.code ?? null,
    refetch: query.refetch,
  };
}
