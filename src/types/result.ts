import type { TebexError } from '../errors/TebexError';

/**
 * Discriminated union for type-safe result handling.
 * Use this for operations that can fail.
 */
export type Result<T, E = TebexError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Creates a successful result.
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates an error result.
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
