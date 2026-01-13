'use client';

import { QueryClient, QueryClientProvider, type QueryClientConfig } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';

import { initTebexClient } from '../services/api';
import type { ResolvedTebexConfig, TebexConfig } from '../types/config';
import { TebexContext, type TebexContextValue } from './context';

/**
 * Default query client configuration optimized for e-commerce.
 */
const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
};

/**
 * Resolves the TebexConfig with default values.
 */
function resolveConfig(config: TebexConfig): ResolvedTebexConfig {
  const baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const completePath = config.urls?.complete ?? '/shop/complete';
  const cancelPath = config.urls?.cancel ?? '/shop/cancel';

  return {
    publicKey: config.publicKey,
    baseUrl,
    completeUrl: `${baseUrl}${completePath}`,
    cancelUrl: `${baseUrl}${cancelPath}`,
    onError: config.onError,
  };
}

/**
 * Props for TebexProvider component.
 */
interface TebexProviderProps {
  readonly children: ReactNode;
  readonly config: TebexConfig;
  /** Optional custom QueryClient. If not provided, a default one will be created. */
  readonly queryClient?: QueryClient | undefined;
}

/**
 * TebexProvider - Main provider component for the Tebex SDK.
 *
 * This provider must wrap your application to use any Tebex hooks.
 * It initializes the Tebex client, sets up React Query, and provides
 * the configuration context.
 *
 * NOTE: React Query Devtools are NOT included in this library to avoid
 * production build issues with jsxDEV. If you need devtools, add them
 * manually in your application:
 *
 * @example
 * ```tsx
 * import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
 *
 * // In your app layout or root component:
 * <TebexProvider config={config}>
 *   {children}
 *   {process.env.NODE_ENV === 'development' && (
 *     <ReactQueryDevtools initialIsOpen={false} />
 *   )}
 * </TebexProvider>
 * ```
 *
 * @example
 * ```tsx
 * <TebexProvider
 *   config={{
 *     publicKey: process.env.NEXT_PUBLIC_TEBEX_KEY!,
 *     baseUrl: 'https://mysite.com',
 *     onError: (error) => toast.error(t(`errors.${error.code}`)),
 *   }}
 * >
 *   {children}
 * </TebexProvider>
 * ```
 */
export function TebexProvider({
  children,
  config,
  queryClient: externalQueryClient,
}: TebexProviderProps): ReactNode {
  const resolvedConfig = useMemo(() => resolveConfig(config), [config]);

  // Create or use external QueryClient
  const [queryClient] = useState(
    () => externalQueryClient ?? new QueryClient(defaultQueryClientConfig),
  );

  // Initialize Tebex client synchronously on first render
  // Using useState initializer to ensure it only runs once
  useState(() => {
    initTebexClient(resolvedConfig.publicKey);
  });

  // Memoize context value
  const contextValue = useMemo<TebexContextValue>(
    () => ({
      config: resolvedConfig,
      queryClient,
    }),
    [resolvedConfig, queryClient],
  );

  return (
    <TebexContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TebexContext.Provider>
  );
}

// Re-export context hooks for backwards compatibility
export { useTebexConfig, useTebexContext } from './context';
