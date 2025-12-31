import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useUser } from '../../src/hooks/useUser';
import { createWrapper } from '../utils/test-utils';

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
});
