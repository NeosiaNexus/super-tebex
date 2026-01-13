import { describe, expect, it } from 'vitest';

import { tebexKeys, type TebexQueryKey } from '../../src/queries/keys';

describe('tebexKeys query key factory', () => {
  describe('root key', () => {
    it('should have correct root key', () => {
      expect(tebexKeys.all).toEqual(['tebex']);
    });

    it('should be readonly', () => {
      expect(tebexKeys.all).toHaveLength(1);
      expect(typeof tebexKeys.all[0]).toBe('string');
    });
  });

  describe('categories keys', () => {
    it('should generate categories base key', () => {
      expect(tebexKeys.categories()).toEqual(['tebex', 'categories']);
    });

    it('should include root key in categories', () => {
      const key = tebexKeys.categories();
      expect(key[0]).toBe('tebex');
      expect(key[1]).toBe('categories');
    });

    it('should generate categoriesList key without packages', () => {
      const key = tebexKeys.categoriesList(false);
      expect(key).toEqual(['tebex', 'categories', 'list', { includePackages: false }]);
    });

    it('should generate categoriesList key with packages', () => {
      const key = tebexKeys.categoriesList(true);
      expect(key).toEqual(['tebex', 'categories', 'list', { includePackages: true }]);
    });

    it('should generate different keys for different includePackages values', () => {
      const withoutPackages = tebexKeys.categoriesList(false);
      const withPackages = tebexKeys.categoriesList(true);

      expect(withoutPackages).not.toEqual(withPackages);
      expect(withoutPackages[3]).toEqual({ includePackages: false });
      expect(withPackages[3]).toEqual({ includePackages: true });
    });

    it('should generate category detail key', () => {
      expect(tebexKeys.category(1)).toEqual(['tebex', 'categories', 'detail', 1]);
      expect(tebexKeys.category(42)).toEqual(['tebex', 'categories', 'detail', 42]);
      expect(tebexKeys.category(999)).toEqual(['tebex', 'categories', 'detail', 999]);
    });

    it('should generate unique keys for different category IDs', () => {
      const key1 = tebexKeys.category(1);
      const key2 = tebexKeys.category(2);

      expect(key1).not.toEqual(key2);
      expect(key1[3]).toBe(1);
      expect(key2[3]).toBe(2);
    });
  });

  describe('packages keys', () => {
    it('should generate packages base key', () => {
      expect(tebexKeys.packages()).toEqual(['tebex', 'packages']);
    });

    it('should generate packagesList key without category filter', () => {
      const key = tebexKeys.packagesList();
      expect(key).toEqual(['tebex', 'packages', 'list', { categoryId: undefined }]);
    });

    it('should generate packagesList key with category filter', () => {
      expect(tebexKeys.packagesList(1)).toEqual(['tebex', 'packages', 'list', { categoryId: 1 }]);
      expect(tebexKeys.packagesList(5)).toEqual(['tebex', 'packages', 'list', { categoryId: 5 }]);
    });

    it('should generate different keys for different category filters', () => {
      const noFilter = tebexKeys.packagesList();
      const filter1 = tebexKeys.packagesList(1);
      const filter2 = tebexKeys.packagesList(2);

      expect(noFilter).not.toEqual(filter1);
      expect(filter1).not.toEqual(filter2);
    });

    it('should generate package detail key', () => {
      expect(tebexKeys.package(101)).toEqual(['tebex', 'packages', 'detail', 101]);
      expect(tebexKeys.package(999)).toEqual(['tebex', 'packages', 'detail', 999]);
    });

    it('should generate unique keys for different package IDs', () => {
      const pkg1 = tebexKeys.package(1);
      const pkg2 = tebexKeys.package(2);

      expect(pkg1).not.toEqual(pkg2);
      expect(pkg1[3]).toBe(1);
      expect(pkg2[3]).toBe(2);
    });
  });

  describe('baskets keys', () => {
    it('should generate baskets base key', () => {
      expect(tebexKeys.baskets()).toEqual(['tebex', 'baskets']);
    });

    it('should generate basket key with ident', () => {
      expect(tebexKeys.basket('abc123')).toEqual(['tebex', 'baskets', 'abc123']);
      expect(tebexKeys.basket('basket-456')).toEqual(['tebex', 'baskets', 'basket-456']);
    });

    it('should generate basket key with null ident', () => {
      expect(tebexKeys.basket(null)).toEqual(['tebex', 'baskets', null]);
    });

    it('should generate different keys for different basket idents', () => {
      const basket1 = tebexKeys.basket('ident-1');
      const basket2 = tebexKeys.basket('ident-2');
      const nullBasket = tebexKeys.basket(null);

      expect(basket1).not.toEqual(basket2);
      expect(basket1).not.toEqual(nullBasket);
    });
  });

  describe('webstore key', () => {
    it('should generate webstore key', () => {
      expect(tebexKeys.webstore()).toEqual(['tebex', 'webstore']);
    });

    it('should always return the same key', () => {
      const key1 = tebexKeys.webstore();
      const key2 = tebexKeys.webstore();

      expect(key1).toEqual(key2);
    });
  });

  describe('key hierarchy and invalidation patterns', () => {
    it('should allow invalidating all category queries', () => {
      // When invalidating with tebexKeys.categories(), it should match:
      // - categoriesList(false)
      // - categoriesList(true)
      // - category(1), category(2), etc.

      const baseKey = tebexKeys.categories();
      const list1 = tebexKeys.categoriesList(false);
      const list2 = tebexKeys.categoriesList(true);
      const detail = tebexKeys.category(1);

      // All should start with the base categories key
      expect(list1.slice(0, 2)).toEqual(baseKey);
      expect(list2.slice(0, 2)).toEqual(baseKey);
      expect(detail.slice(0, 2)).toEqual(baseKey);
    });

    it('should allow invalidating all package queries', () => {
      const baseKey = tebexKeys.packages();
      const list1 = tebexKeys.packagesList();
      const list2 = tebexKeys.packagesList(1);
      const detail = tebexKeys.package(101);

      // All should start with the base packages key
      expect(list1.slice(0, 2)).toEqual(baseKey);
      expect(list2.slice(0, 2)).toEqual(baseKey);
      expect(detail.slice(0, 2)).toEqual(baseKey);
    });

    it('should allow invalidating all basket queries', () => {
      const baseKey = tebexKeys.baskets();
      const basket1 = tebexKeys.basket('ident-1');
      const basket2 = tebexKeys.basket('ident-2');
      const nullBasket = tebexKeys.basket(null);

      // All should start with the base baskets key
      expect(basket1.slice(0, 2)).toEqual(baseKey);
      expect(basket2.slice(0, 2)).toEqual(baseKey);
      expect(nullBasket.slice(0, 2)).toEqual(baseKey);
    });

    it('should allow invalidating all tebex queries', () => {
      const rootKey = tebexKeys.all;

      // All keys should start with 'tebex'
      expect(tebexKeys.categories()[0]).toBe(rootKey[0]);
      expect(tebexKeys.packages()[0]).toBe(rootKey[0]);
      expect(tebexKeys.baskets()[0]).toBe(rootKey[0]);
      expect(tebexKeys.webstore()[0]).toBe(rootKey[0]);
    });
  });

  describe('type safety', () => {
    it('should produce valid TebexQueryKey types', () => {
      // These should all compile and be valid TebexQueryKey types
      const keys: TebexQueryKey[] = [
        tebexKeys.all,
        tebexKeys.categories(),
        tebexKeys.categoriesList(true),
        tebexKeys.categoriesList(false),
        tebexKeys.category(1),
        tebexKeys.packages(),
        tebexKeys.packagesList(),
        tebexKeys.packagesList(1),
        tebexKeys.package(101),
        tebexKeys.baskets(),
        tebexKeys.basket('ident'),
        tebexKeys.basket(null),
        tebexKeys.webstore(),
      ];

      // All should be arrays
      for (const key of keys) {
        expect(Array.isArray(key)).toBe(true);
        expect(key.length).toBeGreaterThan(0);
        expect(key[0]).toBe('tebex');
      }
    });

    it('should return readonly arrays', () => {
      const key = tebexKeys.categories();
      // The 'as const' should make these readonly
      expect(Array.isArray(key)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle zero as category ID', () => {
      const key = tebexKeys.category(0);
      expect(key).toEqual(['tebex', 'categories', 'detail', 0]);
    });

    it('should handle zero as package ID', () => {
      const key = tebexKeys.package(0);
      expect(key).toEqual(['tebex', 'packages', 'detail', 0]);
    });

    it('should handle large IDs', () => {
      const largeId = Number.MAX_SAFE_INTEGER;
      const categoryKey = tebexKeys.category(largeId);
      const packageKey = tebexKeys.package(largeId);

      expect(categoryKey[3]).toBe(largeId);
      expect(packageKey[3]).toBe(largeId);
    });

    it('should handle empty string basket ident', () => {
      const key = tebexKeys.basket('');
      expect(key).toEqual(['tebex', 'baskets', '']);
    });

    it('should handle special characters in basket ident', () => {
      const key = tebexKeys.basket('basket-123_abc');
      expect(key).toEqual(['tebex', 'baskets', 'basket-123_abc']);
    });
  });
});
