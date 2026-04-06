'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import type { Basket } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import type { UseGiftCardsReturn } from '../types/hooks';
import { isNonEmptyString } from '../types/guards';
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
  const basketIdentRef = useRef(basketIdent);
  basketIdentRef.current = basketIdent;
  const queryClient = useQueryClient();
  const config = useTebexConfig();

  const applyMutation = useMutation({
    scope: { id: 'basket-mutations' },
    mutationFn: async (cardNumber: string): Promise<Basket> => {
      if (!isNonEmptyString(cardNumber.trim())) {
        throw new TebexError(TebexErrorCode.GIFTCARD_INVALID, 'Gift card number must be a non-empty string');
      }
      const ident = basketIdentRef.current;
      if (ident === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.apply(ident, 'giftcards', { card_number: cardNumber });
      return tebex.getBasket(ident);
    },
    onMutate: async cardNumber => {
      const ident = basketIdentRef.current;
      if (ident === null) return;
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });

      const previousBasket = queryClient.getQueryData<Basket>(tebexKeys.basket(ident));
      if (previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          giftcards: [...previousBasket.giftcards, { card_number: cardNumber }],
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _cardNumber, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _cardNumber, context) => {
      const ident = context?.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
    },
  });

  const removeMutation = useMutation({
    scope: { id: 'basket-mutations' },
    mutationFn: async (cardNumber: string): Promise<Basket> => {
      if (!isNonEmptyString(cardNumber.trim())) {
        throw new TebexError(TebexErrorCode.GIFTCARD_INVALID, 'Gift card number must be a non-empty string');
      }
      const ident = basketIdentRef.current;
      if (ident === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.remove(ident, 'giftcards', { card_number: cardNumber });
      return tebex.getBasket(ident);
    },
    onMutate: async cardNumber => {
      const ident = basketIdentRef.current;
      if (ident === null) return;
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });

      const previousBasket = queryClient.getQueryData<Basket>(tebexKeys.basket(ident));
      if (previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          giftcards: previousBasket.giftcards.filter(g => g.card_number !== cardNumber),
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _cardNumber, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _cardNumber, context) => {
      const ident = context?.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
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
