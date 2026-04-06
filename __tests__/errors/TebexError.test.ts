import { describe, expect, it } from 'vitest';

import { TebexError } from '../../src/errors/TebexError';
import { TebexErrorCode } from '../../src/errors/codes';

describe('TebexError', () => {
  it('should create error with code and message', () => {
    const error = new TebexError(TebexErrorCode.BASKET_NOT_FOUND, 'Basket not found');

    expect(error.code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
    expect(error.message).toBe('Basket not found');
    expect(error.name).toBe('TebexError');
  });

  it('should use code as message if no message provided', () => {
    const error = new TebexError(TebexErrorCode.UNKNOWN);

    expect(error.message).toBe(TebexErrorCode.UNKNOWN);
  });

  it('should store cause', () => {
    const cause = new Error('Original error');
    const error = new TebexError(TebexErrorCode.UNKNOWN, 'Wrapped error', cause);

    expect(error.cause).toBe(cause);
  });

  describe('fromUnknown', () => {
    it('should return same TebexError if already TebexError', () => {
      const original = new TebexError(TebexErrorCode.BASKET_EMPTY);
      const result = TebexError.fromUnknown(original);

      expect(result).toBe(original);
    });

    it('should detect network errors', () => {
      const error = new Error('Network error occurred');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
      expect(result.cause).toBe(error);
    });

    it('should detect fetch errors', () => {
      const error = new Error('Failed to fetch data');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should detect timeout errors', () => {
      const error = new Error('Request timeout exceeded');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.TIMEOUT);
    });

    it('should detect rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.RATE_LIMITED);
    });

    it('should detect 429 errors', () => {
      const error = new Error('Error 429: Too many requests');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.RATE_LIMITED);
    });

    it('should detect basket not found errors', () => {
      const error = new Error('Basket not found');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
    });

    it('should detect package not found errors', () => {
      const error = new Error('Package not found');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.PACKAGE_NOT_FOUND);
    });

    it('should detect invalid coupon errors', () => {
      const error = new Error('Coupon is invalid');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.COUPON_INVALID);
    });

    it('should detect expired coupon errors', () => {
      const error = new Error('Coupon has expired');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.COUPON_EXPIRED);
    });

    it('should detect invalid gift card errors', () => {
      const error = new Error('Gift card is invalid');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.GIFTCARD_INVALID);
    });

    it('should convert unknown Error to UNKNOWN code', () => {
      const error = new Error('Some random error');
      const result = TebexError.fromUnknown(error);

      expect(result.code).toBe(TebexErrorCode.UNKNOWN);
      expect(result.message).toBe('Some random error');
    });

    it('should handle non-Error values', () => {
      const result = TebexError.fromUnknown('string error');

      expect(result.code).toBe(TebexErrorCode.UNKNOWN);
      expect(result.message).toBe('string error');
    });

    it('should handle null/undefined', () => {
      expect(TebexError.fromUnknown(null).message).toBe('null');
      expect(TebexError.fromUnknown(undefined).message).toBe('undefined');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const error = new TebexError(TebexErrorCode.BASKET_EMPTY, 'Cart is empty');
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'TebexError',
        code: TebexErrorCode.BASKET_EMPTY,
        message: 'Cart is empty',
      });
    });
  });

  describe('fromUnknown HTTP status detection', () => {
    it('should detect 429 as RATE_LIMITED', () => {
      const error = { message: 'Too many requests', response: { status: 429 } };
      expect(TebexError.fromUnknown(error).code).toBe(TebexErrorCode.RATE_LIMITED);
    });
    it('should detect 404 with basket context as BASKET_NOT_FOUND', () => {
      const error = Object.assign(new Error('Basket not found'), { response: { status: 404 } });
      expect(TebexError.fromUnknown(error).code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
    });
    it('should detect 410 as BASKET_EXPIRED', () => {
      const error = { message: 'Gone', response: { status: 410 } };
      expect(TebexError.fromUnknown(error).code).toBe(TebexErrorCode.BASKET_EXPIRED);
    });
    it('should detect 500 as SERVER_ERROR', () => {
      const error = { message: 'Internal error', response: { status: 500 } };
      expect(TebexError.fromUnknown(error).code).toBe(TebexErrorCode.SERVER_ERROR);
    });
    it('should detect 403 as FORBIDDEN', () => {
      const error = { message: 'Forbidden', response: { status: 403 } };
      expect(TebexError.fromUnknown(error).code).toBe(TebexErrorCode.FORBIDDEN);
    });
  });

  describe('toJSON with cause', () => {
    it('should include cause message when cause is an Error', () => {
      const cause = new Error('root cause');
      const error = new TebexError(TebexErrorCode.NETWORK_ERROR, 'Failed', cause);
      const json = error.toJSON();
      expect(json.cause).toBe('root cause');
    });
    it('should omit cause when not an Error', () => {
      const error = new TebexError(TebexErrorCode.UNKNOWN, 'test');
      const json = error.toJSON();
      expect(json.cause).toBeUndefined();
    });
  });

  describe('fromJSON', () => {
    it('should create TebexError from JSON', () => {
      const error = TebexError.fromJSON({ code: TebexErrorCode.RATE_LIMITED, message: 'Slow down' });
      expect(error).toBeInstanceOf(TebexError);
      expect(error.code).toBe(TebexErrorCode.RATE_LIMITED);
      expect(error.message).toBe('Slow down');
    });
    it('should roundtrip through JSON', () => {
      const original = new TebexError(TebexErrorCode.BASKET_NOT_FOUND, 'Gone');
      const restored = TebexError.fromJSON(original.toJSON());
      expect(restored.code).toBe(original.code);
      expect(restored.message).toBe(original.message);
    });
    it('should fall back to UNKNOWN for invalid error codes', () => {
      const result = TebexError.fromJSON({ code: 'NOT_A_REAL_CODE' });
      expect(result.code).toBe(TebexErrorCode.UNKNOWN);
    });
    it('should use code as message when message is omitted', () => {
      const result = TebexError.fromJSON({ code: TebexErrorCode.TIMEOUT });
      expect(result.message).toBe(TebexErrorCode.TIMEOUT);
    });
  });

  describe('fromUnknown — new HTTP status codes', () => {
    it('should map HTTP 400 to VALIDATION_ERROR', () => {
      const error = { message: 'Bad request', response: { status: 400 } };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.VALIDATION_ERROR);
    });

    it('should map HTTP 401 to FORBIDDEN', () => {
      const error = { message: 'Unauthorized', response: { status: 401 } };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.FORBIDDEN);
    });

    it('should map HTTP 408 to TIMEOUT', () => {
      const error = { message: 'Request timeout', response: { status: 408 } };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.TIMEOUT);
    });

    it('should map HTTP 409 to BASKET_LOCKED', () => {
      const error = { message: 'Conflict', response: { status: 409 } };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.BASKET_LOCKED);
    });

    it('should map HTTP 423 to BASKET_LOCKED', () => {
      const error = { message: 'Locked', response: { status: 423 } };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.BASKET_LOCKED);
    });

    it('should map HTTP 504 to TIMEOUT', () => {
      const error = { message: 'Gateway timeout', response: { status: 504 } };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.TIMEOUT);
    });

    it('should map HTTP 502 to SERVER_ERROR', () => {
      const error = { message: 'Bad gateway', response: { status: 502 } };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.SERVER_ERROR);
    });

    it('should map HTTP 503 to SERVER_ERROR', () => {
      const error = { message: 'Service unavailable', response: { status: 503 } };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.SERVER_ERROR);
    });
  });

  describe('fromUnknown — HTTP 404 message context', () => {
    it('should detect 404 with "package" as PACKAGE_NOT_FOUND', () => {
      const error = Object.assign(new Error('Package not found'), { response: { status: 404 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.PACKAGE_NOT_FOUND);
    });

    it('should detect 404 with "category" as CATEGORY_NOT_FOUND', () => {
      const error = Object.assign(new Error('Category not found'), { response: { status: 404 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.CATEGORY_NOT_FOUND);
    });

    it('should detect generic 404 as NOT_FOUND', () => {
      const error = Object.assign(new Error('Resource not found'), { response: { status: 404 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.NOT_FOUND);
    });
  });

  describe('fromUnknown — HTTP 422 message-based detection', () => {
    it('should detect 422 with coupon already used', () => {
      const error = Object.assign(new Error('This coupon has already been used'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.COUPON_ALREADY_USED);
    });

    it('should detect 422 with coupon invalid', () => {
      const error = Object.assign(new Error('The coupon code is invalid'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.COUPON_INVALID);
    });

    it('should detect 422 with coupon expired', () => {
      const error = Object.assign(new Error('This coupon has expired'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.COUPON_EXPIRED);
    });

    it('should detect 422 with gift card invalid', () => {
      const error = Object.assign(new Error('Gift card is invalid'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.GIFTCARD_INVALID);
    });

    it('should detect 422 with gift card insufficient balance', () => {
      const error = Object.assign(new Error('Gift card has insufficient balance'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.GIFTCARD_INSUFFICIENT_BALANCE);
    });

    it('should detect 422 with creator code invalid', () => {
      const error = Object.assign(new Error('Creator code is invalid'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.CREATOR_CODE_INVALID);
    });

    it('should detect 422 with locked basket', () => {
      const error = Object.assign(new Error('Basket is locked'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.BASKET_LOCKED);
    });

    it('should detect 422 with "lock" keyword', () => {
      const error = Object.assign(new Error('Cannot modify a lock state'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.BASKET_LOCKED);
    });

    it('should detect 422 with disabled package', () => {
      const error = Object.assign(new Error('Package is disabled'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.PACKAGE_DISABLED);
    });

    it('should detect 422 with out of stock', () => {
      const error = Object.assign(new Error('Package is out of stock'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.PACKAGE_OUT_OF_STOCK);
    });

    it('should detect 422 with "stock" keyword', () => {
      const error = Object.assign(new Error('Not enough stock available'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.PACKAGE_OUT_OF_STOCK);
    });

    it('should detect 422 with already own', () => {
      const error = Object.assign(new Error('You already own this package'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.PACKAGE_ALREADY_OWNED);
    });

    it('should fall back to VALIDATION_ERROR for generic 422', () => {
      const error = Object.assign(new Error('Unprocessable entity'), { response: { status: 422 } });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.VALIDATION_ERROR);
    });
  });

  describe('fromUnknown — network and abort patterns', () => {
    it('should detect AbortError as TIMEOUT', () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.TIMEOUT);
    });

    it('should detect Safari "Load failed" as NETWORK_ERROR', () => {
      const error = new Error('Load failed');
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should detect ENOTFOUND as NETWORK_ERROR', () => {
      const error = new Error('getaddrinfo ENOTFOUND api.tebex.io');
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should detect ECONNRESET as NETWORK_ERROR', () => {
      const error = new Error('read ECONNRESET');
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should detect ECONNREFUSED as NETWORK_ERROR', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:443');
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should detect ECONNABORTED as NETWORK_ERROR', () => {
      const error = new Error('Request ECONNABORTED');
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should detect ERR_NETWORK as NETWORK_ERROR', () => {
      const error = new Error('ERR_NETWORK');
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should detect ETIMEDOUT as TIMEOUT', () => {
      const error = new Error('connect ETIMEDOUT 1.2.3.4:443');
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.TIMEOUT);
    });
  });

  describe('fromUnknown — Axios error.code detection', () => {
    it('should detect Axios ERR_NETWORK code as NETWORK_ERROR', () => {
      const error = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should detect Axios ECONNABORTED code as TIMEOUT', () => {
      const error = Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.TIMEOUT);
    });

    it('should detect Axios ERR_CANCELED code as TIMEOUT', () => {
      const error = Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' });
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.TIMEOUT);
    });
  });

  describe('extractStatusCode — status on error object directly', () => {
    it('should extract status from error.status (no response wrapper)', () => {
      const error = { message: 'Server error', status: 500 };
      const result = TebexError.fromUnknown(error);
      expect(result.code).toBe(TebexErrorCode.SERVER_ERROR);
    });
  });
});
