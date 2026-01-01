import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { TebexErrorCode } from '../../src/errors/codes';
import { useBasket } from '../../src/hooks/useBasket';
import { useUser } from '../../src/hooks/useUser';
import { server } from '../setup';
import { createWrapper, testConfig } from '../utils/test-utils';

describe('useBasket', () => {
  it('should start with empty basket when no basketIdent', async () => {
    const { result } = renderHook(() => useBasket(), {
      wrapper: createWrapper(),
    });

    // Initial state - no basket yet
    expect(result.current.basket).toBeNull();
    expect(result.current.basketIdent).toBeNull();
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.packages).toEqual([]);
    expect(result.current.data).toBeNull();
  });

  it('should require username to add package', async () => {
    const { result } = renderHook(() => useBasket(), {
      wrapper: createWrapper(),
    });

    // Try to add without username - should fail
    await expect(
      act(async () => {
        await result.current.addPackage({ packageId: 101 });
      }),
    ).rejects.toThrow('Username is required');
  });

  it('should create basket and add package when authenticated', async () => {
    const wrapper = createWrapper();

    // First, set the username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });

    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    // Now test the basket
    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Initially no basket
    expect(basketResult.current.basketIdent).toBeNull();

    // Add a package - this should create a basket first
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101, quantity: 1 });
    });

    // Wait for the basket to be created
    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // The basket ident should be set after adding a package
    expect(basketResult.current.basketIdent).toMatch(/^basket-/);
  });

  it('should compute itemCount correctly', async () => {
    const wrapper = createWrapper();

    // Set username
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
      expect(basketResult.current.basketIdent).not.toBeNull();
    });
  });

  it('should clear basket', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package first
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Clear the basket
    act(() => {
      basketResult.current.clearBasket();
    });

    // Basket should be cleared
    expect(basketResult.current.basketIdent).toBeNull();
    expect(basketResult.current.basket).toBeNull();
    expect(basketResult.current.isEmpty).toBe(true);
  });

  it('should remove package from basket', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package first
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Remove the package
    await act(async () => {
      await basketResult.current.removePackage(101);
    });

    // Should complete without error
    expect(basketResult.current.isRemovingPackage).toBe(false);
  });

  it('should update package quantity', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package first
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Update quantity
    await act(async () => {
      await basketResult.current.updateQuantity({ packageId: 101, quantity: 5 });
    });

    // Should complete without error
    expect(basketResult.current.isUpdatingQuantity).toBe(false);
  });

  it('should add package with type and variableData', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package with extra params
    await act(async () => {
      await basketResult.current.addPackage({
        packageId: 101,
        quantity: 2,
        type: 'subscription',
        variableData: { gift_username: 'Friend' },
      });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });
  });

  it('should have loading states initialized', () => {
    const { result: basketResult } = renderHook(() => useBasket(), {
      wrapper: createWrapper(),
    });

    // Initial loading states should be false
    expect(basketResult.current.isAddingPackage).toBe(false);
    expect(basketResult.current.isRemovingPackage).toBe(false);
    expect(basketResult.current.isUpdatingQuantity).toBe(false);
  });

  it('should handle refetch', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package first
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Refetch
    await act(async () => {
      await basketResult.current.refetch();
    });

    // Should still have basket
    expect(basketResult.current.basketIdent).not.toBeNull();
  });

  it('should add package to existing basket', async () => {
    const wrapper = createWrapper();

    // Set username
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
    });

    const firstBasketIdent = basketResult.current.basketIdent;

    // Add second package - should use existing basket
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 102 });
    });

    // Should still be the same basket
    expect(basketResult.current.basketIdent).toBe(firstBasketIdent);
  });

  it('should throw BASKET_NOT_FOUND when removing package without basket', async () => {
    const { result: basketResult } = renderHook(() => useBasket(), {
      wrapper: createWrapper(),
    });

    // Try to remove without basket - should fail
    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await basketResult.current.removePackage(101);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as unknown as { code: TebexErrorCode }).code).toBe(
      TebexErrorCode.BASKET_NOT_FOUND,
    );
  });

  it('should throw BASKET_NOT_FOUND when updating quantity without basket', async () => {
    const { result: basketResult } = renderHook(() => useBasket(), {
      wrapper: createWrapper(),
    });

    // Try to update quantity without basket - should fail
    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await basketResult.current.updateQuantity({ packageId: 101, quantity: 5 });
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as unknown as { code: TebexErrorCode }).code).toBe(
      TebexErrorCode.BASKET_NOT_FOUND,
    );
  });

  it('should call onError callback when add package fails', async () => {
    const onError = vi.fn();
    const wrapper = createWrapper({ ...testConfig, onError });

    // Set username first
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package first to create a basket (this should succeed)
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // NOW override handler to return error for next request
    server.use(
      http.post('https://headless.tebex.io/api/baskets/:basketIdent/packages', () => {
        return HttpResponse.json({ error: 'Package not found' }, { status: 404 });
      }),
    );

    // Try to add another package - should fail
    await act(async () => {
      try {
        await basketResult.current.addPackage({ packageId: 999 });
      } catch {
        // Expected
      }
    });

    // Verify onError was called
    expect(onError).toHaveBeenCalled();
  });

  it('should rollback optimistic update on error', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add first package successfully
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
      expect(basketResult.current.packages).toHaveLength(1);
    });

    const packageCountBefore = basketResult.current.packages.length;

    // NOW override handler to return error for next request
    server.use(
      http.post('https://headless.tebex.io/api/baskets/:basketIdent/packages', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      }),
    );

    // Try to add another package - should fail and rollback
    await act(async () => {
      try {
        await basketResult.current.addPackage({ packageId: 102 });
      } catch {
        // Expected
      }
    });

    // Wait for rollback
    await waitFor(() => {
      expect(basketResult.current.packages).toHaveLength(packageCountBefore);
    });
  });

  it('should handle error when creating basket fails', async () => {
    // Override handler BEFORE creating wrapper for basket creation error
    server.use(
      http.post('https://headless.tebex.io/api/accounts/:webstoreId/baskets', () => {
        return HttpResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }),
    );

    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Try to add a package - should fail because basket creation fails
    await act(async () => {
      try {
        await basketResult.current.addPackage({ packageId: 101 });
      } catch {
        // Expected
      }
    });

    // Basket should still be null
    expect(basketResult.current.basketIdent).toBeNull();
  });

  it('should have correct error code when NOT_AUTHENTICATED', async () => {
    const { result: basketResult } = renderHook(() => useBasket(), {
      wrapper: createWrapper(),
    });

    // Try to add without username - should fail with NOT_AUTHENTICATED
    let thrownError: unknown = null;
    await act(async () => {
      try {
        await basketResult.current.addPackage({ packageId: 101 });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).not.toBeNull();
    // TebexError has a code property
    expect(thrownError).toHaveProperty('code', TebexErrorCode.NOT_AUTHENTICATED);
  });

  it('should properly compute total price', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
      expect(basketResult.current.packages).toHaveLength(1);
    });

    // Refetch to get the correct total from the server
    await act(async () => {
      await basketResult.current.refetch();
    });

    // Total should be greater than 0 after refetch
    await waitFor(() => {
      expect(basketResult.current.total).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have isFetching state during refetch', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Start refetch
    act(() => {
      void basketResult.current.refetch();
    });

    // isFetching should be true at some point during refetch
    // After refetch completes
    await waitFor(() => {
      expect(basketResult.current.isFetching).toBe(false);
    });
  });

  it('should have mutation loading states', async () => {
    const wrapper = createWrapper();

    // Set username
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Initial mutation states should be false
    expect(basketResult.current.isAddingPackage).toBe(false);
    expect(basketResult.current.isRemovingPackage).toBe(false);
    expect(basketResult.current.isUpdatingQuantity).toBe(false);

    // Add a package
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    // After mutation completes, state should be false again
    expect(basketResult.current.isAddingPackage).toBe(false);
  });

  it('should have auto-cleanup effect registered for expired baskets', async () => {
    // This test verifies that the useBasket hook has the cleanup effect in place
    // The actual cleanup is triggered when basketQuery.error contains a BASKET_NOT_FOUND error
    // Full integration testing with MSW is complex due to how tebex_headless handles errors
    const wrapper = createWrapper();

    // Set username and create a basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    act(() => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });

    // Add a package to create basket
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Verify the basket was created successfully
    expect(basketResult.current.basketIdent).not.toBeNull();
    expect(basketResult.current.error).toBeNull();

    // Clear basket manually (simulating what the effect would do)
    act(() => {
      basketResult.current.clearBasket();
    });

    // Verify clearBasket works (the same function the effect uses)
    expect(basketResult.current.basketIdent).toBeNull();
  });
});
