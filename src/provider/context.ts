'use client';

import type { QueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import type { ResolvedTebexConfig } from '../types/config';

/**
 * Context value provided by TebexProvider.
 */
export interface TebexContextValue {
  readonly config: ResolvedTebexConfig;
  readonly queryClient: QueryClient;
  readonly isHydrated: boolean;
}

/**
 * Tebex context for sharing configuration and QueryClient.
 * Used by both TebexProvider and TebexMockProvider.
 */
export const TebexContext = createContext<TebexContextValue | null>(null);

/**
 * Hook to access the Tebex context.
 * Must be used within a TebexProvider or TebexMockProvider.
 *
 * @throws TebexError if used outside of a provider
 */
export function useTebexContext(): TebexContextValue {
  const context = useContext(TebexContext);

  if (context === null) {
    throw new TebexError(
      TebexErrorCode.PROVIDER_NOT_FOUND,
      'useTebexContext must be used within TebexProvider or TebexMockProvider',
    );
  }

  return context;
}

/**
 * Hook to access just the Tebex configuration.
 * Useful when you don't need the QueryClient.
 */
export function useTebexConfig(): ResolvedTebexConfig {
  const { config } = useTebexContext();
  return config;
}

/**
 * Hook to check if Zustand stores have finished hydrating from localStorage.
 * Useful to prevent actions before persisted state is available.
 */
export function useTebexHydrated(): boolean {
  const { isHydrated } = useTebexContext();
  return isHydrated;
}
