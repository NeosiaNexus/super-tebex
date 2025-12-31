import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useGiftPackage } from '../../src/hooks/useGiftPackage';
import { useUser } from '../../src/hooks/useUser';
import { createWrapper } from '../utils/test-utils';

describe('useGiftPackage', () => {
  it('should start with initial state', () => {
    const { result } = renderHook(() => useGiftPackage(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isGifting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should require authentication to gift', async () => {
    const { result } = renderHook(() => useGiftPackage(), {
      wrapper: createWrapper(),
    });

    // Try to gift without authentication
    await expect(
      act(async () => {
        await result.current.gift({
          packageId: 101,
          targetUsername: 'FriendPlayer',
        });
      }),
    ).rejects.toThrow('Username is required');
  });

  it('should gift package when authenticated', async () => {
    const wrapper = createWrapper();

    // Set up user
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    await waitFor(() => {
      expect(userResult.current.isAuthenticated).toBe(true);
    });

    // Now test gift package
    const { result: giftResult } = renderHook(() => useGiftPackage(), { wrapper });

    await act(async () => {
      await giftResult.current.gift({
        packageId: 101,
        targetUsername: 'FriendPlayer',
        quantity: 1,
      });
    });

    expect(giftResult.current.isGifting).toBe(false);
    expect(giftResult.current.error).toBeNull();
  });
});
