import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useCategories } from '../../src/hooks/useCategories';
import { usePackage } from '../../src/hooks/usePackage';
import { useUser } from '../../src/hooks/useUser';
import { useWebstore } from '../../src/hooks/useWebstore';
import {
  createEmptyResponseHandler,
  createMalformedJsonHandler,
  createNetworkErrorHandler,
  mockData,
} from '../mocks/handlers';
import { server } from '../setup';
import { createWrapper, TebexErrorCode } from '../utils/test-utils';

const BASE_URL = 'https://headless.tebex.io/api';
const ACCOUNTS_URL = `${BASE_URL}/accounts/:webstoreId`;
const BASKETS_URL = `${BASE_URL}/baskets/:basketIdent`;

describe('Edge Cases', () => {
  describe('Malformed API Responses', () => {
    it('should handle malformed JSON response for categories', async () => {
      server.use(createMalformedJsonHandler('get', `${ACCOUNTS_URL}/categories`));

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have an error - categories is null when error occurs
      expect(result.current.error).not.toBeNull();
      expect(result.current.categories).toBeNull();
    });

    it('should handle malformed JSON response for webstore', async () => {
      server.use(createMalformedJsonHandler('get', ACCOUNTS_URL));

      const { result } = renderHook(() => useWebstore(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.webstore).toBeNull();
    });

    it('should handle empty response body for categories', async () => {
      server.use(createEmptyResponseHandler('get', `${ACCOUNTS_URL}/categories`));

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Empty response results in null data or error
      expect(result.current.categories).toBeNull();
    });

    it('should handle response with unexpected data structure', async () => {
      server.use(
        http.get(`${ACCOUNTS_URL}/categories`, () => {
          // Return data in wrong format (object instead of array)
          return HttpResponse.json({ data: { unexpected: 'structure' } });
        }),
      );

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // tebex_headless SDK returns the data as-is, so we get the unexpected structure
      // The hook doesn't validate the shape, it just returns what the SDK gives it
      expect(result.current.error).toBeNull();
      // The data is not an array, so it's treated as the response
    });
  });

  describe('Network Errors', () => {
    it('should handle network error for categories', async () => {
      server.use(createNetworkErrorHandler('get', `${ACCOUNTS_URL}/categories`));

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.errorCode).toBe(TebexErrorCode.NETWORK_ERROR);
    });

    it('should handle network error for package detail', async () => {
      server.use(createNetworkErrorHandler('get', `${ACCOUNTS_URL}/packages/:id`));

      const { result } = renderHook(() => usePackage(101), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.package).toBeNull();
    });

    it('should handle network error during basket creation', async () => {
      server.use(createNetworkErrorHandler('post', `${ACCOUNTS_URL}/baskets`));

      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      await act(async () => {
        try {
          await basketResult.current.addPackage({ packageId: 101 });
        } catch {
          // Expected to fail
        }
      });

      // Basket should not have been created
      expect(basketResult.current.basketIdent).toBeNull();
    });
  });

  describe('Large Datasets', () => {
    it('should handle basket with many packages', async () => {
      // Create a handler that returns a basket with 50 packages
      const manyPackages = Array.from({ length: 50 }, (_, i) => ({
        id: 1000 + i,
        name: `Package ${i}`,
        description: `Description for package ${i}`,
        image: null,
        in_basket: {
          quantity: 1,
          price: 9.99,
          gift_username: null,
        },
      }));

      server.use(
        http.get(`${ACCOUNTS_URL}/baskets/:basketIdent`, () => {
          return HttpResponse.json({
            data: {
              ...mockData.basket,
              packages: manyPackages,
              total_price: manyPackages.length * 9.99,
            },
          });
        }),
      );

      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // Add a package to trigger basket creation
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
      });

      // Verify large dataset is handled
      await waitFor(() => {
        expect(basketResult.current.packages.length).toBe(50);
      });

      expect(basketResult.current.itemCount).toBe(50);
      expect(basketResult.current.total).toBeCloseTo(499.5, 1);
    });

    it('should handle categories list with many categories', async () => {
      const manyCategories = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Category ${i + 1}`,
        slug: `category-${i + 1}`,
        description: `Description for category ${i + 1}`,
        packages: [],
      }));

      server.use(
        http.get(`${ACCOUNTS_URL}/categories`, () => {
          return HttpResponse.json({ data: manyCategories });
        }),
      );

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.categories).toHaveLength(100);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent add and remove operations', async () => {
      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // Add first package
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
        expect(basketResult.current.packages).toHaveLength(1);
      });

      // Add second package
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 102 });
      });

      await waitFor(() => {
        expect(basketResult.current.packages).toHaveLength(2);
      });

      // Now perform add and remove concurrently
      await act(async () => {
        const addPromise = basketResult.current.addPackage({ packageId: 201 });
        const removePromise = basketResult.current.removePackage(101);

        await Promise.all([addPromise, removePromise]);
      });

      // After both operations complete
      await waitFor(() => {
        // Should have 102 and 201, but not 101
        const packageIds = basketResult.current.packages.map(p => p.id);
        expect(packageIds).not.toContain(101);
        expect(packageIds).toContain(102);
        expect(packageIds).toContain(201);
      });
    });

    it('should handle rapid sequential operations', async () => {
      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // Rapid sequential operations
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101, quantity: 1 });
      });

      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
      });

      // Multiple rapid updates
      await act(async () => {
        await basketResult.current.updateQuantity({ packageId: 101, quantity: 2 });
        await basketResult.current.updateQuantity({ packageId: 101, quantity: 3 });
        await basketResult.current.updateQuantity({ packageId: 101, quantity: 5 });
      });

      // Final state should reflect last update
      await waitFor(() => {
        expect(basketResult.current.packages[0].in_basket.quantity).toBe(5);
      });
    });

    it('should handle multiple hooks accessing same data', async () => {
      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      // Create multiple basket hooks
      const { result: basket1 } = renderHook(() => useBasket(), { wrapper });
      const { result: basket2 } = renderHook(() => useBasket(), { wrapper });

      // Add package using first hook
      await act(async () => {
        await basket1.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basket1.current.basketIdent).not.toBeNull();
      });

      // Both hooks should see the same basketIdent
      expect(basket1.current.basketIdent).toBe(basket2.current.basketIdent);

      // Both should see the same packages
      await waitFor(() => {
        expect(basket1.current.packages).toHaveLength(1);
        expect(basket2.current.packages).toHaveLength(1);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover after network error resolves', async () => {
      // First request fails
      server.use(createNetworkErrorHandler('get', `${ACCOUNTS_URL}/categories`));

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();

      // Reset handlers to normal
      server.resetHandlers();

      // Refetch should succeed
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.categories.length).toBeGreaterThan(0);
    });

    it('should handle error then success sequence for basket operations', async () => {
      const onError = vi.fn();
      const wrapper = createWrapper({
        publicKey: 'test-key',
        baseUrl: 'https://test.example.com',
        urls: {
          complete: '/shop/complete',
          cancel: '/shop/cancel',
        },
        onError,
      });

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // First add succeeds
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101 });
      });

      await waitFor(() => {
        expect(basketResult.current.packages).toHaveLength(1);
      });

      // Configure next request to fail
      server.use(
        http.post(`${BASKETS_URL}/packages`, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        }),
      );

      // Second add fails
      await act(async () => {
        try {
          await basketResult.current.addPackage({ packageId: 102 });
        } catch {
          // Expected
        }
      });

      // onError should have been called
      expect(onError).toHaveBeenCalled();

      // Reset handlers
      server.resetHandlers();

      // Third add should succeed
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 102 });
      });

      await waitFor(() => {
        expect(basketResult.current.packages).toHaveLength(2);
      });
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle package with zero quantity', async () => {
      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // Add package
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101, quantity: 1 });
      });

      await waitFor(() => {
        expect(basketResult.current.packages).toHaveLength(1);
      });

      // Update to zero quantity (edge case)
      await act(async () => {
        await basketResult.current.updateQuantity({ packageId: 101, quantity: 0 });
      });

      await waitFor(() => {
        expect(basketResult.current.packages[0].in_basket.quantity).toBe(0);
      });
    });

    it('should handle very large quantity values', async () => {
      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // Add package with very large quantity
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101, quantity: 99999 });
      });

      await waitFor(() => {
        expect(basketResult.current.packages).toHaveLength(1);
      });

      expect(basketResult.current.packages[0].in_basket.quantity).toBe(99999);
      expect(basketResult.current.itemCount).toBe(99999);
    });

    it('should handle package ID as zero', async () => {
      // Mock a package with ID 0 using the correct route pattern
      server.use(
        http.get(`${ACCOUNTS_URL}/packages/:id`, ({ params }) => {
          const id = Number(params.id);
          if (id === 0) {
            return HttpResponse.json({
              data: {
                id: 0,
                name: 'Free Item',
                description: 'Free item',
                type: 'single',
                base_price: 0,
                sales_price: 0,
                total_price: 0,
                currency: 'EUR',
                image: null,
                category: { id: 1, name: 'VIP' },
                discount: 0,
                gift_username_required: false,
              },
            });
          }
          return HttpResponse.json({ error: 'Package not found' }, { status: 404 });
        }),
      );

      // usePackage takes an options object, not a number directly
      const { result } = renderHook(() => usePackage({ id: 0 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The hook should handle package ID 0
      expect(result.current.package?.id).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state across refetches', async () => {
      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // Add packages
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101, quantity: 2 });
      });

      await waitFor(() => {
        expect(basketResult.current.packages).toHaveLength(1);
      });

      const itemCountBefore = basketResult.current.itemCount;
      const totalBefore = basketResult.current.total;

      // Multiple refetches
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await basketResult.current.refetch();
        });
      }

      // State should be consistent
      expect(basketResult.current.itemCount).toBe(itemCountBefore);
      expect(basketResult.current.total).toBe(totalBefore);
      expect(basketResult.current.packages).toHaveLength(1);
    });

    it('should maintain computed values accuracy', async () => {
      const wrapper = createWrapper();

      const { result: userResult } = renderHook(() => useUser(), { wrapper });
      act(() => {
        userResult.current.setUsername('TestPlayer');
      });

      const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

      // Build up a basket with multiple items
      await act(async () => {
        await basketResult.current.addPackage({ packageId: 101, quantity: 2 }); // VIP Gold = 9.99
      });

      await waitFor(() => {
        expect(basketResult.current.basketIdent).not.toBeNull();
      });

      await act(async () => {
        await basketResult.current.addPackage({ packageId: 102, quantity: 1 }); // VIP Diamond = 19.99
      });

      await waitFor(() => {
        expect(basketResult.current.packages).toHaveLength(2);
      });

      // Verify computed values
      expect(basketResult.current.itemCount).toBe(3); // 2 + 1
      expect(basketResult.current.isEmpty).toBe(false);

      // Refetch and verify again
      await act(async () => {
        await basketResult.current.refetch();
      });

      // Computed values should match
      const computedItemCount = basketResult.current.packages.reduce(
        (acc, pkg) => acc + pkg.in_basket.quantity,
        0,
      );
      expect(basketResult.current.itemCount).toBe(computedItemCount);
    });
  });
});
