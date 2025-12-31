import { TebexError } from '../errors/TebexError';
import type { Result } from './result';

/**
 * Type guard to check if an error is a TebexError.
 */
export function isTebexError(error: unknown): error is TebexError {
  return error instanceof TebexError;
}

/**
 * Type guard to check if a Result is successful.
 */
export function isSuccess<T, E>(
  result: Result<T, E>,
): result is { readonly success: true; readonly data: T } {
  return result.success;
}

/**
 * Type guard to check if a Result is an error.
 */
export function isError<T, E>(
  result: Result<T, E>,
): result is { readonly success: false; readonly error: E } {
  return !result.success;
}

/**
 * Type guard to check if a value is defined (not null or undefined).
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a positive number.
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}
