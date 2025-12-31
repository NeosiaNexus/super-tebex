import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useUser } from '../../src/hooks/useUser';
import { useUserStore } from '../../src/stores/userStore';

describe('useUser', () => {
  beforeEach(() => {
    // Reset store before each test
    useUserStore.setState({ username: null });
  });

  afterEach(() => {
    // Clean up after tests
    useUserStore.setState({ username: null });
  });

  it('should return null username initially', () => {
    const { result } = renderHook(() => useUser());

    expect(result.current.username).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set username', async () => {
    const { result } = renderHook(() => useUser());

    await act(async () => {
      result.current.setUsername('TestPlayer');
    });

    await waitFor(() => {
      expect(result.current.username).toBe('TestPlayer');
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should trim username when setting', async () => {
    const { result } = renderHook(() => useUser());

    await act(async () => {
      result.current.setUsername('  TestPlayer  ');
    });

    await waitFor(() => {
      expect(result.current.username).toBe('TestPlayer');
    });
  });

  it('should not set empty username', async () => {
    const { result } = renderHook(() => useUser());

    await act(async () => {
      result.current.setUsername('TestPlayer');
    });

    await waitFor(() => {
      expect(result.current.username).toBe('TestPlayer');
    });

    await act(async () => {
      result.current.setUsername('   ');
    });

    // Should keep old value
    expect(result.current.username).toBe('TestPlayer');
  });

  it('should clear username', async () => {
    const { result } = renderHook(() => useUser());

    await act(async () => {
      result.current.setUsername('TestPlayer');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      result.current.clearUsername();
    });

    await waitFor(() => {
      expect(result.current.username).toBeNull();
    });
    expect(result.current.isAuthenticated).toBe(false);
  });
});
