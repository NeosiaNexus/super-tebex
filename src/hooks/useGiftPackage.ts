'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import { useUserStore } from '../stores/userStore';
import type { GiftPackageParams, UseGiftPackageReturn } from '../types/hooks';

/**
 * Hook to gift a package to another player.
 *
 * @returns Gift package state and action
 *
 * @example
 * ```tsx
 * const { gift, isGifting, error } = useGiftPackage();
 *
 * const handleGift = async () => {
 *   await gift({
 *     packageId: 123,
 *     targetUsername: 'FriendName',
 *     quantity: 1,
 *   });
 * };
 * ```
 */
export function useGiftPackage(): UseGiftPackageReturn {
  const basketIdent = useBasketStore(state => state.basketIdent);
  const setBasketIdent = useBasketStore(state => state.setBasketIdent);
  const username = useUserStore(state => state.username);
  const queryClient = useQueryClient();
  const config = useTebexConfig();

  const giftMutation = useMutation({
    mutationFn: async (params: GiftPackageParams): Promise<void> => {
      if (username === null || username.length === 0) {
        throw new TebexError(
          TebexErrorCode.NOT_AUTHENTICATED,
          'Username is required to gift a package',
        );
      }

      const tebex = getTebexClient();

      // Ensure we have a basket
      let ident = basketIdent;
      if (ident === null) {
        const newBasket = await tebex.createMinecraftBasket(
          username,
          config.completeUrl,
          config.cancelUrl,
        );
        ident = newBasket.ident;
        setBasketIdent(ident);
      }

      // Add package as a gift
      await tebex.addPackageToBasket(ident, params.packageId, params.quantity ?? 1, 'single', {
        gift_username: params.targetUsername,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tebexKeys.basket(basketIdent),
      });
    },
    onError: error => {
      config.onError?.(TebexError.fromUnknown(error));
    },
  });

  const gift = useCallback(
    async (params: GiftPackageParams): Promise<void> => {
      await giftMutation.mutateAsync(params);
    },
    [giftMutation],
  );

  const error = useMemo(
    () => (giftMutation.error !== null ? TebexError.fromUnknown(giftMutation.error) : null),
    [giftMutation.error],
  );

  return {
    gift,
    isGifting: giftMutation.isPending,
    error,
    errorCode: error?.code ?? null,
  };
}
