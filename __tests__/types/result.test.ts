import { describe, expect, it } from 'vitest';

import { TebexError } from '../../src/errors/TebexError';
import { TebexErrorCode } from '../../src/errors/codes';
import { err, ok, type Result } from '../../src/types/result';

describe('Result utilities', () => {
  describe('ok', () => {
    it('should create a success result with data', () => {
      const result = ok('test data');
      expect(result.success).toBe(true);
      expect(result.data).toBe('test data');
    });

    it('should work with various data types', () => {
      // String
      const stringResult = ok('hello');
      expect(stringResult.success).toBe(true);
      expect(stringResult.data).toBe('hello');

      // Number
      const numberResult = ok(42);
      expect(numberResult.success).toBe(true);
      expect(numberResult.data).toBe(42);

      // Boolean
      const boolResult = ok(true);
      expect(boolResult.success).toBe(true);
      expect(boolResult.data).toBe(true);

      // Object
      const objResult = ok({ name: 'John', age: 30 });
      expect(objResult.success).toBe(true);
      expect(objResult.data).toEqual({ name: 'John', age: 30 });

      // Array
      const arrayResult = ok([1, 2, 3]);
      expect(arrayResult.success).toBe(true);
      expect(arrayResult.data).toEqual([1, 2, 3]);

      // Null
      const nullResult = ok(null);
      expect(nullResult.success).toBe(true);
      expect(nullResult.data).toBeNull();

      // Undefined
      const undefinedResult = ok(undefined);
      expect(undefinedResult.success).toBe(true);
      expect(undefinedResult.data).toBeUndefined();
    });

    it('should have correct readonly properties', () => {
      const result = ok({ value: 1 });
      expect(result.success).toBe(true);
      // The result should not have an error property for success
      expect('error' in result).toBe(false);
    });

    it('should work with complex nested types', () => {
      interface User {
        id: number;
        profile: {
          name: string;
          settings: {
            theme: 'light' | 'dark';
            notifications: boolean;
          };
        };
      }

      const user: User = {
        id: 1,
        profile: {
          name: 'Test User',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      };

      const result = ok(user);
      expect(result.success).toBe(true);
      expect(result.data.profile.settings.theme).toBe('dark');
    });
  });

  describe('err', () => {
    it('should create an error result with TebexError', () => {
      const error = new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      const result = err(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.error.code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
    });

    it('should create an error result with custom message', () => {
      const error = new TebexError(TebexErrorCode.INVALID_CONFIG, 'Missing public key');
      const result = err(error);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Missing public key');
    });

    it('should work with various error types', () => {
      // TebexError
      const tebexResult = err(new TebexError(TebexErrorCode.NETWORK_ERROR));
      expect(tebexResult.success).toBe(false);
      expect(tebexResult.error.code).toBe(TebexErrorCode.NETWORK_ERROR);

      // Standard Error
      const standardResult = err(new Error('Standard error'));
      expect(standardResult.success).toBe(false);
      expect(standardResult.error.message).toBe('Standard error');

      // String error
      const stringResult = err('String error');
      expect(stringResult.success).toBe(false);
      expect(stringResult.error).toBe('String error');

      // Object error
      const objResult = err({ code: 'CUSTOM', message: 'Custom error' });
      expect(objResult.success).toBe(false);
      expect(objResult.error).toEqual({ code: 'CUSTOM', message: 'Custom error' });
    });

    it('should have correct readonly properties', () => {
      const result = err('test error');
      expect(result.success).toBe(false);
      // The result should not have a data property for error
      expect('data' in result).toBe(false);
    });

    it('should work with all TebexErrorCode values', () => {
      const errorCodes: TebexErrorCode[] = [
        TebexErrorCode.UNKNOWN_ERROR,
        TebexErrorCode.NETWORK_ERROR,
        TebexErrorCode.INVALID_CONFIG,
        TebexErrorCode.BASKET_NOT_FOUND,
        TebexErrorCode.BASKET_EXPIRED,
        TebexErrorCode.PACKAGE_NOT_FOUND,
        TebexErrorCode.CATEGORY_NOT_FOUND,
        TebexErrorCode.NOT_AUTHENTICATED,
        TebexErrorCode.TEBEX_JS_NOT_LOADED,
        TebexErrorCode.CHECKOUT_CANCELLED,
        TebexErrorCode.CHECKOUT_FAILED,
        TebexErrorCode.INVALID_COUPON,
        TebexErrorCode.INVALID_GIFT_CARD,
        TebexErrorCode.INVALID_CREATOR_CODE,
      ];

      for (const code of errorCodes) {
        const result = err(new TebexError(code));
        expect(result.success).toBe(false);
        expect(result.error.code).toBe(code);
      }
    });
  });

  describe('Result type usage patterns', () => {
    it('should support type-safe handling with conditional checks', () => {
      function processResult<T>(result: Result<T, TebexError>): string {
        if (result.success) {
          return `Success: ${JSON.stringify(result.data)}`;
        } else {
          return `Error: ${result.error.code}`;
        }
      }

      const successResult = ok({ value: 42 });
      expect(processResult(successResult)).toBe('Success: {"value":42}');

      const errorResult = err(new TebexError(TebexErrorCode.BASKET_NOT_FOUND));
      expect(processResult(errorResult)).toBe('Error: BASKET_NOT_FOUND');
    });

    it('should support early return patterns', () => {
      function mayFail(shouldFail: boolean): Result<number, TebexError> {
        if (shouldFail) {
          return err(new TebexError(TebexErrorCode.UNKNOWN_ERROR));
        }
        return ok(42);
      }

      const success = mayFail(false);
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBe(42);
      }

      const failure = mayFail(true);
      expect(failure.success).toBe(false);
      if (!failure.success) {
        expect(failure.error.code).toBe(TebexErrorCode.UNKNOWN_ERROR);
      }
    });

    it('should support chaining with multiple results', () => {
      function step1(): Result<number, TebexError> {
        return ok(1);
      }

      function step2(input: number): Result<number, TebexError> {
        if (input <= 0) {
          return err(new TebexError(TebexErrorCode.INVALID_CONFIG));
        }
        return ok(input * 2);
      }

      function step3(input: number): Result<string, TebexError> {
        return ok(`Result: ${input}`);
      }

      // Chain the operations
      const result1 = step1();
      if (!result1.success) {
        expect.fail('step1 should succeed');
        return;
      }

      const result2 = step2(result1.data);
      if (!result2.success) {
        expect.fail('step2 should succeed');
        return;
      }

      const result3 = step3(result2.data);
      if (result3.success) {
        expect(result3.data).toBe('Result: 2');
      }
    });

    it('should support async result patterns', async () => {
      async function asyncOperation(): Promise<Result<string, TebexError>> {
        // Simulate async work
        await Promise.resolve();
        return ok('async result');
      }

      const result = await asyncOperation();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('async result');
      }
    });

    it('should support generic error types', () => {
      interface ValidationError {
        field: string;
        message: string;
      }

      function validateEmail(email: string): Result<string, ValidationError> {
        if (!email.includes('@')) {
          return err({ field: 'email', message: 'Invalid email format' });
        }
        return ok(email);
      }

      const validResult = validateEmail('test@example.com');
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data).toBe('test@example.com');
      }

      const invalidResult = validateEmail('invalid');
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.error.field).toBe('email');
        expect(invalidResult.error.message).toBe('Invalid email format');
      }
    });

    it('should work with union types as data', () => {
      type ApiResponse = { type: 'user'; name: string } | { type: 'guest'; sessionId: string };

      function getResponse(isUser: boolean): Result<ApiResponse, TebexError> {
        if (isUser) {
          return ok({ type: 'user', name: 'John' });
        }
        return ok({ type: 'guest', sessionId: 'abc123' });
      }

      const userResult = getResponse(true);
      if (userResult.success && userResult.data.type === 'user') {
        expect(userResult.data.name).toBe('John');
      }

      const guestResult = getResponse(false);
      if (guestResult.success && guestResult.data.type === 'guest') {
        expect(guestResult.data.sessionId).toBe('abc123');
      }
    });
  });

  describe('Result immutability', () => {
    it('should return readonly success result', () => {
      const result = ok({ value: 1 });

      // These should be readonly
      expect(Object.isFrozen(result)).toBe(false); // Object itself is not frozen
      expect(result.success).toBe(true);

      // The structure should be consistent
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.data).toBe('object');
    });

    it('should return readonly error result', () => {
      const result = err(new TebexError(TebexErrorCode.UNKNOWN_ERROR));

      expect(result.success).toBe(false);
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.error).toBe('object');
    });
  });
});
