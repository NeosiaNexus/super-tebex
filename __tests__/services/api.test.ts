import { afterEach, describe, expect, it } from 'vitest';

import {
  getTebexClient,
  initTebexClient,
  isTebexClientInitialized,
  resetTebexClient,
} from '../../src/services/api';

describe('api service', () => {
  afterEach(() => {
    resetTebexClient();
  });

  describe('isTebexClientInitialized', () => {
    it('should return false when not initialized', () => {
      expect(isTebexClientInitialized()).toBe(false);
    });

    it('should return true after initialization', () => {
      initTebexClient('test-public-key');
      expect(isTebexClientInitialized()).toBe(true);
    });
  });

  describe('getTebexClient', () => {
    it('should throw when not initialized', () => {
      expect(() => getTebexClient()).toThrow(
        'Tebex client not initialized. Make sure you are using TebexProvider.',
      );
    });

    it('should return client after initialization', () => {
      initTebexClient('test-public-key');
      const client = getTebexClient();

      expect(client).toBeDefined();
    });
  });

  describe('resetTebexClient', () => {
    it('should reset the client', () => {
      initTebexClient('test-public-key');
      expect(isTebexClientInitialized()).toBe(true);

      resetTebexClient();
      expect(isTebexClientInitialized()).toBe(false);
    });
  });
});
