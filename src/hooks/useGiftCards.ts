'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import type { UseGiftCardsReturn } from '../types/hooks';
import { useBasket } from './useBasket';

/**
 * Hook to manage gift cards on the basket.
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
    mutationFn: async (cardNumber: string): Promise<void> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.apply(basketIdent, 'giftcards', { card_number: cardNumber });
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

  const removeMutation = useMutation({
    mutationFn: async (cardNumber: string): Promise<void> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.remove(basketIdent, 'giftcards', { card_number: cardNumber });
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
