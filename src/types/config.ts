import type { TebexError } from '../errors/TebexError';

/**
 * URL configuration for checkout redirects.
 */
export interface TebexUrls {
  /** URL to redirect after successful payment. Default: /shop/complete */
  readonly complete?: string | undefined;
  /** URL to redirect after cancelled payment. Default: /shop/cancel */
  readonly cancel?: string | undefined;
}

/**
 * Main configuration for TebexProvider.
 *
 * NOTE: React Query DevTools are NOT included in this library to avoid
 * production build issues. If you need devtools, add them manually:
 *
 * @example
 * ```tsx
 * import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
 *
 * <TebexProvider config={config}>
 *   {children}
 *   {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
 * </TebexProvider>
 * ```
 */
export interface TebexConfig {
  /** Your Tebex public/webstore key */
  readonly publicKey: string;
  /** Base URL of your site (e.g., https://mysite.com) */
  readonly baseUrl: string;
  /** Optional URL paths for checkout redirects */
  readonly urls?: TebexUrls | undefined;
  /** Global error handler callback */
  readonly onError?: ((error: TebexError) => void) | undefined;
}

/**
 * Internal resolved configuration with default values applied.
 */
export interface ResolvedTebexConfig {
  readonly publicKey: string;
  readonly baseUrl: string;
  readonly completeUrl: string;
  readonly cancelUrl: string;
  readonly onError?: ((error: TebexError) => void) | undefined;
}
