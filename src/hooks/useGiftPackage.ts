'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { Basket, BasketPackage } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import { useUserStore } from '../stores/userStore';
import { isPositiveInteger, isValidMinecraftUsername } from '../types/guards';
import type { GiftPackageParams, UseGiftPackageReturn } from '../types/hooks';

/**
 * Hook to gift a package to another player with optimistic updates.
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
    mutationFn: async (params: GiftPackageParams): Promise<Basket> => {
      if (username === null || username.length === 0) {
        throw new TebexError(
          TebexErrorCode.NOT_AUTHENTICATED,
          'Username is required to gift a package',
        );
      }

      // Validate target username format
      if (!isValidMinecraftUsername(params.targetUsername)) {
        throw new TebexError(
          TebexErrorCode.INVALID_USERNAME,
          'Target username must be 3-16 alphanumeric characters',
        );
      }

      // Validate quantity if provided
      const quantity = params.quantity ?? 1;
      if (!isPositiveInteger(quantity)) {
        throw new TebexError(
          TebexErrorCode.INVALID_QUANTITY,
          'Quantity must be a positive integer',
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
      await tebex.addPackageToBasket(ident, params.packageId, quantity, 'single', {
        gift_username: params.targetUsername,
      });

      // Return updated basket for cache sync
      return tebex.getBasket(ident);
    },
    onMutate: async params => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(basketIdent) });

      // Snapshot previous value
      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(basketIdent));

      // Optimistically add the gift package (if we have a basket)
      if (previousBasket !== null && previousBasket !== undefined) {
        const optimisticPackage: BasketPackage = {
          id: params.packageId,
          name: 'Loading...',
          description: '',
          image: null,
          in_basket: {
            quantity: params.quantity ?? 1,
            price: 0,
            gift_username_id: null,
            gift_username: params.targetUsername,
          },
        };

        queryClient.setQueryData<Basket>(tebexKeys.basket(basketIdent), {
          ...previousBasket,
          packages: [...previousBasket.packages, optimisticPackage],
        });
      }

      return { previousBasket };
    },
    onError: (_error, _params, context) => {
      // Rollback on error
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(basketIdent), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: data => {
      // Sync with server response
      queryClient.setQueryData(tebexKeys.basket(basketIdent), data);
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
