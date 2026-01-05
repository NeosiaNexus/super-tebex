'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { TebexError } from '../errors/TebexError';
import { TebexContext, type TebexContextValue } from '../provider/context';
import { tebexKeys } from '../queries/keys';
import { useBasketStore } from '../stores/basketStore';
import { useUserStore } from '../stores/userStore';
import type { ResolvedTebexConfig } from '../types/config';
import {
  defaultMockBasket,
  defaultMockCategories,
  defaultMockPackages,
  defaultMockWebstore,
  type MockBasket,
  type MockCategory,
  type MockDataConfig,
  type MockPackage,
  type MockWebstoreData,
} from './mockData';

/**
 * Props for TebexMockProvider component.
 */
export interface TebexMockProviderProps {
  readonly children: ReactNode;

  /**
   * Mock data to use. If not provided, defaults will be used.
   */
  readonly mockData?: MockDataConfig | undefined;

  /**
   * Mock username to set in the user store.
   * @default 'TestPlayer'
   */
  readonly username?: string | null | undefined;

  /**
   * Whether to initialize a basket.
   * If true and mockData.basket is provided, that basket will be used.
   * If true and no basket is provided, an empty basket will be created.
   * @default true
   */
  readonly withBasket?: boolean | undefined;

  /**
   * Base URL for the mock store.
   * @default 'https://mock.tebex.io'
   */
  readonly baseUrl?: string | undefined;

  /**
   * Callback when an error occurs.
   */
  readonly onError?: ((error: TebexError) => void) | undefined;
}

/**
 * Create a QueryClient configured for mocking.
 * - Infinite staleTime so queries never auto-refetch
 * - No retries
 * - Instant garbage collection time for testing
 */
function createMockQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Resolve mock config with defaults.
 */
function resolveMockConfig(
  baseUrl: string,
  onError?: (error: TebexError) => void,
): ResolvedTebexConfig {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    publicKey: 'mock-public-key',
    baseUrl: cleanBaseUrl,
    completeUrl: `${cleanBaseUrl}/shop/complete`,
    cancelUrl: `${cleanBaseUrl}/shop/cancel`,
    onError,
    devtools: false,
  };
}

/**
 * Populate the QueryClient with mock data.
 */
function populateMockData(
  queryClient: QueryClient,
  config: {
    webstore: MockWebstoreData;
    categories: MockCategory[];
    packages: MockPackage[];
    basket: MockBasket | null;
    basketIdent: string | null;
  },
): void {
  // Webstore data
  queryClient.setQueryData(tebexKeys.webstore(), {
    id: config.webstore.id,
    name: config.webstore.name,
    description: config.webstore.description,
    currency: config.webstore.currency,
    domain: config.webstore.domain,
    logo: config.webstore.logo,
  });

  // Categories with packages
  queryClient.setQueryData(tebexKeys.categoriesList(true), config.categories);

  // Categories without packages
  queryClient.setQueryData(
    tebexKeys.categoriesList(false),
    config.categories.map(cat => ({ ...cat, packages: [] })),
  );

  // Individual categories
  for (const category of config.categories) {
    queryClient.setQueryData(tebexKeys.category(category.id), category);
  }

  // All packages
  queryClient.setQueryData(tebexKeys.packagesList(), config.packages);

  // Packages by category
  const packagesByCategory = new Map<number, MockPackage[]>();
  for (const pkg of config.packages) {
    const categoryId = pkg.category.id;
    const existing = packagesByCategory.get(categoryId) ?? [];
    packagesByCategory.set(categoryId, [...existing, pkg]);
  }
  for (const [categoryId, packages] of packagesByCategory) {
    queryClient.setQueryData(tebexKeys.packagesList(categoryId), packages);
  }

  // Individual packages
  for (const pkg of config.packages) {
    queryClient.setQueryData(tebexKeys.package(pkg.id), pkg);
  }

  // Basket (if provided)
  if (config.basket !== null && config.basketIdent !== null) {
    queryClient.setQueryData(tebexKeys.basket(config.basketIdent), config.basket);
  }
}

/**
 * Component to sync mock data with stores.
 */
function MockStoreSync({
  username,
  basketIdent,
}: {
  username: string | null;
  basketIdent: string | null;
}): null {
  const setUsername = useUserStore(state => state.setUsername);
  const clearUsername = useUserStore(state => state.clearUsername);
  const setBasketIdent = useBasketStore(state => state.setBasketIdent);
  const clearBasketIdent = useBasketStore(state => state.clearBasketIdent);

  useEffect(() => {
    if (username !== null) {
      setUsername(username);
    } else {
      clearUsername();
    }
  }, [username, setUsername, clearUsername]);

  useEffect(() => {
    if (basketIdent !== null) {
      setBasketIdent(basketIdent);
    } else {
      clearBasketIdent();
    }
  }, [basketIdent, setBasketIdent, clearBasketIdent]);

  return null;
}

/**
 * TebexMockProvider - A mock provider for testing and Storybook.
 *
 * This provider pre-populates TanStack Query with mock data, allowing
 * you to render components that use Tebex hooks without making real API calls.
 *
 * **Features:**
 * - Pre-populated categories, packages, and webstore data
 * - Optional basket state
 * - No network requests (queries have infinite staleTime)
 * - Same context interface as TebexProvider
 *
 * **Limitations:**
 * - Mutations (addPackage, removePackage, etc.) won't persist changes
 * - For full mutation support, use MSW with the provided handlers
 *
 * @example Basic usage
 * ```tsx
 * import { TebexMockProvider, mockData } from '@neosianexus/super-tebex/testing';
 *
 * <TebexMockProvider>
 *   <ShopPage />
 * </TebexMockProvider>
 * ```
 *
 * @example Custom mock data
 * ```tsx
 * <TebexMockProvider
 *   mockData={{
 *     webstore: { name: 'My Custom Store', currency: 'USD' },
 *     basket: mockData.basketWithMultipleItems,
 *   }}
 *   username="CustomPlayer"
 * >
 *   <CheckoutPage />
 * </TebexMockProvider>
 * ```
 *
 * @example Without basket (for category/package browsing)
 * ```tsx
 * <TebexMockProvider withBasket={false}>
 *   <CatalogPage />
 * </TebexMockProvider>
 * ```
 */
export function TebexMockProvider({
  children,
  mockData: mockDataConfig,
  username = 'TestPlayer',
  withBasket = true,
  baseUrl = 'https://mock.tebex.io',
  onError,
}: TebexMockProviderProps): ReactNode {
  // Resolve mock data with defaults
  const resolvedMockData = useMemo(() => {
    const webstore: MockWebstoreData = {
      ...defaultMockWebstore,
      ...mockDataConfig?.webstore,
    };

    const categories = mockDataConfig?.categories ?? defaultMockCategories;
    const packages = mockDataConfig?.packages ?? defaultMockPackages;

    let basket: MockBasket | null = null;
    let basketIdent: string | null = null;

    if (withBasket) {
      basket = mockDataConfig?.basket
        ? { ...defaultMockBasket, ...mockDataConfig.basket }
        : defaultMockBasket;
      basketIdent = basket.ident;

      // Set username on basket if provided
      if (username !== null) {
        basket = { ...basket, username };
      }
    }

    return { webstore, categories, packages, basket, basketIdent };
  }, [mockDataConfig, withBasket, username]);

  // Create QueryClient once
  const [queryClient] = useState(() => createMockQueryClient());

  // Resolve config
  const resolvedConfig = useMemo(() => resolveMockConfig(baseUrl, onError), [baseUrl, onError]);

  // Populate mock data on mount and when data changes
  useEffect(() => {
    populateMockData(queryClient, resolvedMockData);
  }, [queryClient, resolvedMockData]);

  // Context value
  const contextValue = useMemo<TebexContextValue>(
    () => ({
      config: resolvedConfig,
      queryClient,
    }),
    [resolvedConfig, queryClient],
  );

  return (
    <TebexContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        <MockStoreSync username={username} basketIdent={resolvedMockData.basketIdent} />
        {children}
      </QueryClientProvider>
    </TebexContext.Provider>
  );
}

/**
 * Hook to check if we're inside a mock provider.
 * Useful for conditional logic in components.
 *
 * Note: This hook checks for any Tebex provider (real or mock).
 * The mock provider is identified by its configuration.
 */
export function useIsMockProvider(): boolean {
  const context = useContext(TebexContext);
  return context !== null && context.config.publicKey === 'mock-public-key';
}
