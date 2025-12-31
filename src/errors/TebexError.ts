import { TebexErrorCode } from './codes';

/**
 * Custom error class for Tebex SDK errors.
 * Provides structured error handling with error codes.
 */
export class TebexError extends Error {
  public readonly code: TebexErrorCode;
  public readonly cause?: unknown;

  constructor(code: TebexErrorCode, message?: string, cause?: unknown) {
    super(message ?? code);
    this.name = 'TebexError';
    this.code = code;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, TebexError);
    }
  }

  /**
   * Converts an unknown error to a TebexError.
   * If the error is already a TebexError, it returns it as-is.
   */
  static fromUnknown(error: unknown): TebexError {
    if (error instanceof TebexError) {
      return error;
    }

    if (error instanceof Error) {
      // Try to detect specific error types from tebex_headless
      const message = error.message.toLowerCase();

      if (message.includes('network') || message.includes('fetch')) {
        return new TebexError(TebexErrorCode.NETWORK_ERROR, error.message, error);
      }

      if (message.includes('timeout')) {
        return new TebexError(TebexErrorCode.TIMEOUT, error.message, error);
      }

      if (message.includes('rate limit') || message.includes('429')) {
        return new TebexError(TebexErrorCode.RATE_LIMITED, error.message, error);
      }

      if (message.includes('basket') && message.includes('not found')) {
        return new TebexError(TebexErrorCode.BASKET_NOT_FOUND, error.message, error);
      }

      if (message.includes('package') && message.includes('not found')) {
        return new TebexError(TebexErrorCode.PACKAGE_NOT_FOUND, error.message, error);
      }

      if (message.includes('coupon') && message.includes('invalid')) {
        return new TebexError(TebexErrorCode.COUPON_INVALID, error.message, error);
      }

      if (message.includes('coupon') && message.includes('expired')) {
        return new TebexError(TebexErrorCode.COUPON_EXPIRED, error.message, error);
      }

      if (message.includes('gift') && message.includes('invalid')) {
        return new TebexError(TebexErrorCode.GIFTCARD_INVALID, error.message, error);
      }

      return new TebexError(TebexErrorCode.UNKNOWN, error.message, error);
    }

    return new TebexError(TebexErrorCode.UNKNOWN, String(error));
  }

  /**
   * Returns a JSON representation of the error.
   */
  toJSON(): { name: string; code: TebexErrorCode; message: string } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
    };
  }
}
