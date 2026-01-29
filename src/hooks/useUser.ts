'use client';

import { useCallback } from 'react';

import { useUserStore } from '../stores/userStore';
import { isValidMinecraftUsername } from '../types/guards';
import type { UseUserReturn } from '../types/hooks';

/**
 * Hook to manage the current user (Minecraft username).
 * Username is persisted in localStorage.
 *
 * @returns User state and actions
 *
 * @example
 * ```tsx
 * const { username, setUsername, isAuthenticated, isValidUsername } = useUser();
 *
 * if (!isAuthenticated) {
 *   return <UsernameForm onSubmit={setUsername} />;
 * }
 *
 * return <p>Welcome, {username}!</p>;
 * ```
 */
export function useUser(): UseUserReturn {
  const username = useUserStore(state => state.username);
  const setUsernameStore = useUserStore(state => state.setUsername);
  const clearUsernameStore = useUserStore(state => state.clearUsername);

  const setUsername = useCallback(
    (newUsername: string): boolean => {
      const trimmed = newUsername.trim();
      if (isValidMinecraftUsername(trimmed)) {
        setUsernameStore(trimmed);
        return true;
      }
      return false;
    },
    [setUsernameStore],
  );

  const clearUsername = useCallback(() => {
    clearUsernameStore();
  }, [clearUsernameStore]);

  const isAuthenticated = username !== null && username.length > 0;

  return {
    username,
    setUsername,
    clearUsername,
    isAuthenticated,
  };
}
