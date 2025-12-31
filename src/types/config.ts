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
  /** Enable React Query DevTools. Default: true in development */
  readonly devtools?: boolean | undefined;
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
  readonly devtools: boolean;
}
