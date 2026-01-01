import { QueryClient } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { TebexError } from '../../src/errors/TebexError';
import { TebexErrorCode } from '../../src/errors/codes';
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
 * Type guard to check if an error is a TebexError
 */
export function isTebexError(error: unknown): error is TebexError {
  return error instanceof TebexError;
}

/**
 * Type-safe assertion helper for TebexError
 * Use this instead of `as any` in tests
 */
export function assertTebexError(error: unknown): TebexError {
  if (!isTebexError(error)) {
    throw new Error(`Expected TebexError but got ${typeof error}: ${String(error)}`);
  }
  return error;
}

/**
 * Expect a TebexError with specific code
 * @example
 * expectTebexError(thrownError, TebexErrorCode.BASKET_NOT_FOUND);
 */
export function expectTebexError(
  error: unknown,
  expectedCode: TebexErrorCode,
  expectedMessagePattern?: RegExp,
): void {
  const tebexError = assertTebexError(error);
  if (tebexError.code !== expectedCode) {
    throw new Error(
      `Expected error code ${expectedCode} but got ${tebexError.code}. Message: ${tebexError.message}`,
    );
  }
  if (expectedMessagePattern !== undefined && !expectedMessagePattern.test(tebexError.message)) {
    throw new Error(
      `Expected message to match ${expectedMessagePattern} but got: ${tebexError.message}`,
    );
  }
}

/**
 * Helper to capture thrown errors from async operations
 * Returns null if no error was thrown
 */
export async function captureAsyncError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}

/**
 * Helper to capture thrown errors from sync operations
 */
export function captureSyncError(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

/**
 * Re-export error types for convenience in tests
 */
export { TebexError, TebexErrorCode };

/**
 * Re-export testing utilities
 */
export * from '@testing-library/react';
export { renderWithProvider as render };
