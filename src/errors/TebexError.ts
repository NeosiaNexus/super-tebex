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
        case 400:
          return new TebexError(TebexErrorCode.VALIDATION_ERROR, message, error);
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
          if (lowerMessage.includes('category')) {
            return new TebexError(TebexErrorCode.CATEGORY_NOT_FOUND, message, error);
          }
          return new TebexError(TebexErrorCode.NOT_FOUND, message, error);
        }
        case 408:
          return new TebexError(TebexErrorCode.TIMEOUT, message, error);
        case 409:
          return new TebexError(TebexErrorCode.BASKET_LOCKED, message, error);
        case 410:
          return new TebexError(TebexErrorCode.BASKET_EXPIRED, message, error);
        case 422: {
          const lowerMessage = message.toLowerCase();
          if (lowerMessage.includes('coupon') && lowerMessage.includes('already')) {
            return new TebexError(TebexErrorCode.COUPON_ALREADY_USED, message, error);
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
          if (lowerMessage.includes('gift') && lowerMessage.includes('balance')) {
            return new TebexError(TebexErrorCode.GIFTCARD_INSUFFICIENT_BALANCE, message, error);
          }
          if (lowerMessage.includes('creator') && lowerMessage.includes('invalid')) {
            return new TebexError(TebexErrorCode.CREATOR_CODE_INVALID, message, error);
          }
          if (lowerMessage.includes('locked') || lowerMessage.includes('lock')) {
            return new TebexError(TebexErrorCode.BASKET_LOCKED, message, error);
          }
          if (lowerMessage.includes('disabled')) {
            return new TebexError(TebexErrorCode.PACKAGE_DISABLED, message, error);
          }
          if (lowerMessage.includes('out of stock') || lowerMessage.includes('stock')) {
            return new TebexError(TebexErrorCode.PACKAGE_OUT_OF_STOCK, message, error);
          }
          if (lowerMessage.includes('already own')) {
            return new TebexError(TebexErrorCode.PACKAGE_ALREADY_OWNED, message, error);
          }
          return new TebexError(TebexErrorCode.VALIDATION_ERROR, message, error);
        }
        case 423:
          return new TebexError(TebexErrorCode.BASKET_LOCKED, message, error);
        case 429:
          return new TebexError(TebexErrorCode.RATE_LIMITED, message, error);
        case 500:
        case 502:
        case 503:
          return new TebexError(TebexErrorCode.SERVER_ERROR, message, error);
        case 504:
          return new TebexError(TebexErrorCode.TIMEOUT, message, error);
      }
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new TebexError(TebexErrorCode.TIMEOUT, message, error);
      }

      // Detect Axios error codes (stored in error.code, not error.message)
      if ('code' in error) {
        const axiosCode = (error as { code: unknown }).code;
        if (typeof axiosCode === 'string') {
          if (axiosCode === 'ERR_NETWORK' || axiosCode === 'ERR_FR_TOO_MANY_REDIRECTS') {
            return new TebexError(TebexErrorCode.NETWORK_ERROR, message, error);
          }
          if (axiosCode === 'ECONNABORTED' || axiosCode === 'ERR_CANCELED') {
            return new TebexError(TebexErrorCode.TIMEOUT, message, error);
          }
        }
      }

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes('network') ||
        lowerMessage.includes('fetch') ||
        lowerMessage.includes('load failed') ||
        lowerMessage.includes('enotfound') ||
        lowerMessage.includes('econnreset') ||
        lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('econnaborted') ||
        lowerMessage.includes('err_network')
      ) {
        return new TebexError(TebexErrorCode.NETWORK_ERROR, message, error);
      }

      if (lowerMessage.includes('timeout') || lowerMessage.includes('etimedout')) {
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
  static fromJSON(json: { code: string; message?: string }): TebexError {
    const validCodes = Object.values(TebexErrorCode) as string[];
    const code = validCodes.includes(json.code)
      ? (json.code as TebexErrorCode)
      : TebexErrorCode.UNKNOWN;
    return new TebexError(code, json.message ?? json.code);
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
