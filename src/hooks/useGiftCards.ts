'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { Basket } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import type { UseGiftCardsReturn } from '../types/hooks';
import { useBasket } from './useBasket';

/**
 * Hook to manage gift cards on the basket with optimistic updates.
 *
 * @returns Gift card state and actions
 *
 * @example
 * ```tsx
 * const { giftCards, apply, remove, isApplying } = useGiftCards();
 *
 * const handleApply = async (cardNumber: string) => {
 *   try {
 *     await apply(cardNumber);
 *     toast.success('Gift card applied!');
 *   } catch (error) {
 *     toast.error('Invalid gift card');
 *   }
 * };
 * ```
 */
export function useGiftCards(): UseGiftCardsReturn {
  const { basket } = useBasket();
  const basketIdent = useBasketStore(state => state.basketIdent);
  const queryClient = useQueryClient();
  const config = useTebexConfig();

  const applyMutation = useMutation({
    mutationFn: async (cardNumber: string): Promise<Basket> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.apply(basketIdent, 'giftcards', { card_number: cardNumber });
      return tebex.getBasket(basketIdent);
    },
    onMutate: async cardNumber => {
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(basketIdent) });

      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(basketIdent));

      // Optimistically add the gift card
      if (previousBasket !== null && previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(basketIdent), {
          ...previousBasket,
          giftcards: [...previousBasket.giftcards, { card_number: cardNumber }],
        });
      }

      return { previousBasket };
    },
    onError: (_error, _cardNumber, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(basketIdent), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: data => {
      queryClient.setQueryData(tebexKeys.basket(basketIdent), data);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (cardNumber: string): Promise<Basket> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.remove(basketIdent, 'giftcards', { card_number: cardNumber });
      return tebex.getBasket(basketIdent);
    },
    onMutate: async cardNumber => {
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(basketIdent) });

      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(basketIdent));

      // Optimistically remove the gift card
      if (previousBasket !== null && previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(basketIdent), {
          ...previousBasket,
          giftcards: previousBasket.giftcards.filter(g => g.card_number !== cardNumber),
        });
      }

      return { previousBasket };
    },
    onError: (_error, _cardNumber, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(basketIdent), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: data => {
      queryClient.setQueryData(tebexKeys.basket(basketIdent), data);
    },
  });

  const apply = useCallback(
    async (cardNumber: string): Promise<void> => {
      await applyMutation.mutateAsync(cardNumber);
    },
    [applyMutation],
  );

  const remove = useCallback(
    async (cardNumber: string): Promise<void> => {
      await removeMutation.mutateAsync(cardNumber);
    },
    [removeMutation],
  );

  const combinedError = applyMutation.error ?? removeMutation.error;
  const error = useMemo(
    () => (combinedError !== null ? TebexError.fromUnknown(combinedError) : null),
    [combinedError],
  );

  return {
    giftCards: basket?.giftcards ?? [],
    apply,
    remove,
    isApplying: applyMutation.isPending,
    isRemoving: removeMutation.isPending,
    error,
    errorCode: error?.code ?? null,
  };
}
