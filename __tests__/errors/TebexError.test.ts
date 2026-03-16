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
  });
});
