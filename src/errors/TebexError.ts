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
    Object.setPrototypeOf(this, TebexError.prototype);
    this.name = 'TebexError';
    this.code = code;
    this.cause = cause;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, TebexError);
    }
  }

  private static extractStatusCode(error: unknown): number | null {
    if (typeof error === 'object' && error !== null) {
      if ('response' in error) {
        const response = (error as { response?: { status?: unknown } }).response;
        if (response && typeof response.status === 'number') return response.status;
      }
      if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
        return (error as { status: number }).status;
      }
    }
    return null;
  }

  /**
   * Converts an unknown error to a TebexError.
   * If the error is already a TebexError, it returns it as-is.
   */
  static fromUnknown(error: unknown): TebexError {
    if (error instanceof TebexError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const statusCode = TebexError.extractStatusCode(error);

    if (statusCode !== null) {
      switch (statusCode) {
        case 401:
        case 403:
          return new TebexError(TebexErrorCode.FORBIDDEN, message, error);
        case 404: {
          const lowerMessage = message.toLowerCase();
          if (lowerMessage.includes('basket')) {
            return new TebexError(TebexErrorCode.BASKET_NOT_FOUND, message, error);
          }
          if (lowerMessage.includes('package')) {
            return new TebexError(TebexErrorCode.PACKAGE_NOT_FOUND, message, error);
          }
          return new TebexError(TebexErrorCode.NOT_FOUND, message, error);
        }
        case 410:
          return new TebexError(TebexErrorCode.BASKET_EXPIRED, message, error);
        case 422:
          return new TebexError(TebexErrorCode.VALIDATION_ERROR, message, error);
        case 429:
          return new TebexError(TebexErrorCode.RATE_LIMITED, message, error);
        case 500:
        case 502:
        case 503:
          return new TebexError(TebexErrorCode.SERVER_ERROR, message, error);
      }
    }

    if (error instanceof Error) {
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
        return new TebexError(TebexErrorCode.NETWORK_ERROR, message, error);
      }

      if (lowerMessage.includes('timeout')) {
        return new TebexError(TebexErrorCode.TIMEOUT, message, error);
      }

      if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
        return new TebexError(TebexErrorCode.RATE_LIMITED, message, error);
      }

      if (lowerMessage.includes('basket') && lowerMessage.includes('not found')) {
        return new TebexError(TebexErrorCode.BASKET_NOT_FOUND, message, error);
      }

      if (lowerMessage.includes('package') && lowerMessage.includes('not found')) {
        return new TebexError(TebexErrorCode.PACKAGE_NOT_FOUND, message, error);
      }

      if (lowerMessage.includes('coupon') && lowerMessage.includes('invalid')) {
        return new TebexError(TebexErrorCode.COUPON_INVALID, message, error);
      }

      if (lowerMessage.includes('coupon') && lowerMessage.includes('expired')) {
        return new TebexError(TebexErrorCode.COUPON_EXPIRED, message, error);
      }

      if (lowerMessage.includes('gift') && lowerMessage.includes('invalid')) {
        return new TebexError(TebexErrorCode.GIFTCARD_INVALID, message, error);
      }

      return new TebexError(TebexErrorCode.UNKNOWN, message, error);
    }

    return new TebexError(TebexErrorCode.UNKNOWN, message);
  }

  /**
   * Creates a TebexError from a JSON representation.
   */
  static fromJSON(json: { code: TebexErrorCode; message?: string }): TebexError {
    return new TebexError(json.code, json.message ?? json.code);
  }

  /**
   * Returns a JSON representation of the error.
   */
  toJSON(): { name: string; code: TebexErrorCode; message: string; cause?: string } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.cause instanceof Error ? { cause: this.cause.message } : {}),
    };
  }
}
