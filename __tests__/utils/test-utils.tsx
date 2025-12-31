import { QueryClient } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { TebexProvider } from '../../src/provider/TebexProvider';
import type { TebexConfig } from '../../src/types/config';

/**
 * Default test configuration
 */
export const testConfig: TebexConfig = {
  publicKey: 'test-public-key',
  baseUrl: 'https://test.example.com',
  urls: {
    complete: '/shop/complete',
    cancel: '/shop/cancel',
  },
};

/**
 * Create a fresh QueryClient for each test
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

/**
 * Create a wrapper with TebexProvider for testing hooks
 */
export function createWrapper(
  config: TebexConfig = testConfig,
): ({ children }: WrapperProps) => ReactElement {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: WrapperProps): ReactElement {
    return (
      <TebexProvider config={config} queryClient={queryClient}>
        {children}
      </TebexProvider>
    );
  };
}

/**
 * Custom render function with TebexProvider
 */
export function renderWithProvider(
  ui: ReactElement,
  config: TebexConfig = testConfig,
  options?: Omit<RenderOptions, 'wrapper'>,
): ReturnType<typeof render> {
  return render(ui, { wrapper: createWrapper(config), ...options });
}

/**
 * Re-export testing utilities
 */
export * from '@testing-library/react';
export { renderWithProvider as render };
