import { describe, expect, it } from 'vitest';

import { TebexError } from '../../src/errors/TebexError';
import { TebexErrorCode } from '../../src/errors/codes';
import {
  isDefined,
  isError,
  isNonEmptyString,
  isPositiveNumber,
  isSuccess,
  isTebexError,
} from '../../src/types/guards';
import { err, ok } from '../../src/types/result';

describe('Type Guards', () => {
  describe('isTebexError', () => {
    it('should return true for TebexError instances', () => {
      const error = new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      expect(isTebexError(error)).toBe(true);
    });

    it('should return true for TebexError with message', () => {
      const error = new TebexError(TebexErrorCode.INVALID_CONFIG, 'Custom message');
      expect(isTebexError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Not a TebexError');
      expect(isTebexError(error)).toBe(false);
    });

    it('should return false for plain objects', () => {
      const obj = { code: TebexErrorCode.BASKET_NOT_FOUND, message: 'fake' };
      expect(isTebexError(obj)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isTebexError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTebexError(undefined)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isTebexError('error')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isTebexError(42)).toBe(false);
    });
  });

  describe('isSuccess', () => {
    it('should return true for success result', () => {
      const result = ok({ value: 'test' });
      expect(isSuccess(result)).toBe(true);
    });

    it('should return false for error result', () => {
      const result = err(new TebexError(TebexErrorCode.UNKNOWN_ERROR));
      expect(isSuccess(result)).toBe(false);
    });

    it('should narrow type correctly for success', () => {
      const result = ok(42);
      if (isSuccess(result)) {
        // TypeScript should know result.data exists here
        expect(result.data).toBe(42);
      }
    });

    it('should work with different data types', () => {
      expect(isSuccess(ok('string'))).toBe(true);
      expect(isSuccess(ok(123))).toBe(true);
      expect(isSuccess(ok(true))).toBe(true);
      expect(isSuccess(ok(null))).toBe(true);
      expect(isSuccess(ok([1, 2, 3]))).toBe(true);
      expect(isSuccess(ok({ key: 'value' }))).toBe(true);
    });
  });

  describe('isError', () => {
    it('should return true for error result', () => {
      const result = err(new TebexError(TebexErrorCode.BASKET_NOT_FOUND));
      expect(isError(result)).toBe(true);
    });

    it('should return false for success result', () => {
      const result = ok({ value: 'test' });
      expect(isError(result)).toBe(false);
    });

    it('should narrow type correctly for error', () => {
      const result = err('custom error');
      if (isError(result)) {
        // TypeScript should know result.error exists here
        expect(result.error).toBe('custom error');
      }
    });

    it('should work with different error types', () => {
      expect(isError(err('string error'))).toBe(true);
      expect(isError(err(new Error('standard error')))).toBe(true);
      expect(isError(err(new TebexError(TebexErrorCode.NETWORK_ERROR)))).toBe(true);
      expect(isError(err({ code: 'CUSTOM' }))).toBe(true);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined('string')).toBe(true);
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
      expect(isDefined('')).toBe(true);
    });

    it('should return false for null', () => {
      expect(isDefined(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isDefined(undefined)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const maybeString: string | null | undefined = 'hello';
      if (isDefined(maybeString)) {
        // TypeScript should know maybeString is string here
        expect(maybeString.toUpperCase()).toBe('HELLO');
      }
    });

    it('should work with complex types', () => {
      interface User {
        name: string;
      }
      const user: User | null = { name: 'John' };
      expect(isDefined(user)).toBe(true);

      const nullUser: User | null = null;
      expect(isDefined(nullUser)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString(' ')).toBe(true);
      expect(isNonEmptyString('a')).toBe(true);
      expect(isNonEmptyString('longer string with spaces')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isNonEmptyString('')).toBe(false);
    });

    it('should return false for non-string types', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(true)).toBe(false);
      expect(isNonEmptyString([])).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
      expect(isNonEmptyString(['a', 'b'])).toBe(false);
    });

    it('should narrow type correctly', () => {
      const maybeString: unknown = 'test';
      if (isNonEmptyString(maybeString)) {
        // TypeScript should know maybeString is string here
        expect(maybeString.length).toBe(4);
      }
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(42)).toBe(true);
      expect(isPositiveNumber(0.5)).toBe(true);
      expect(isPositiveNumber(0.001)).toBe(true);
      expect(isPositiveNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(isPositiveNumber(1e10)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-0.5)).toBe(false);
      expect(isPositiveNumber(-100)).toBe(false);
    });

    it('should return false for non-finite numbers', () => {
      expect(isPositiveNumber(Infinity)).toBe(false);
      expect(isPositiveNumber(-Infinity)).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
    });

    it('should return false for non-number types', () => {
      expect(isPositiveNumber(null)).toBe(false);
      expect(isPositiveNumber(undefined)).toBe(false);
      expect(isPositiveNumber('42')).toBe(false);
      expect(isPositiveNumber(true)).toBe(false);
      expect(isPositiveNumber([])).toBe(false);
      expect(isPositiveNumber({})).toBe(false);
    });

    it('should narrow type correctly', () => {
      const maybeNumber: unknown = 5;
      if (isPositiveNumber(maybeNumber)) {
        // TypeScript should know maybeNumber is number here
        expect(maybeNumber * 2).toBe(10);
      }
    });
  });
});

describe('Result Type Integration', () => {
  it('should handle chained result checks', () => {
    const result = ok('success');

    if (isSuccess(result)) {
      expect(result.data).toBe('success');
    } else {
      // This should not execute
      expect.fail('Should be success');
    }
  });

  it('should work with error handling flow', () => {
    const result = err(new TebexError(TebexErrorCode.INVALID_CONFIG));

    if (isError(result)) {
      const error = result.error;
      if (isTebexError(error)) {
        expect(error.code).toBe(TebexErrorCode.INVALID_CONFIG);
      }
    }
  });

  it('should support union result types', () => {
    type ApiResult = ReturnType<typeof ok<{ id: number }>> | ReturnType<typeof err<TebexError>>;

    const successResult: ApiResult = ok({ id: 1 });
    const errorResult: ApiResult = err(new TebexError(TebexErrorCode.NETWORK_ERROR));

    expect(isSuccess(successResult)).toBe(true);
    expect(isError(successResult)).toBe(false);

    expect(isSuccess(errorResult)).toBe(false);
    expect(isError(errorResult)).toBe(true);
  });
});
