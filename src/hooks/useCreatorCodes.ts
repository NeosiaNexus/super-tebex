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
import type { UseCreatorCodesReturn } from '../types/hooks';
import { useBasket } from './useBasket';

/**
 * Hook to manage creator codes on the basket with optimistic updates.
 *
 * @returns Creator code state and actions
 *
 * @example
 * ```tsx
 * const { creatorCode, apply, remove, isApplying } = useCreatorCodes();
 *
 * const handleApply = async (code: string) => {
 *   try {
 *     await apply(code);
 *     toast.success('Creator code applied!');
 *   } catch (error) {
 *     toast.error('Invalid creator code');
 *   }
 * };
 * ```
 */
export function useCreatorCodes(): UseCreatorCodesReturn {
  const { basket } = useBasket();
  const basketIdent = useBasketStore(state => state.basketIdent);
  const basketIdentRef = useRef(basketIdent);
  basketIdentRef.current = basketIdent;
  const queryClient = useQueryClient();
  const config = useTebexConfig();

  const applyMutation = useMutation({
    scope: { id: 'basket-mutations' },
    mutationFn: async (code: string): Promise<Basket> => {
      const ident = basketIdentRef.current;
      if (ident === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.apply(ident, 'creator-codes', { creator_code: code });
      return tebex.getBasket(ident);
    },
    onMutate: async code => {
      const ident = basketIdentRef.current;
      if (ident === null) return;
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });

      const previousBasket = queryClient.getQueryData<Basket>(tebexKeys.basket(ident));
      if (previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          creator_code: code,
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _code, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _code, context) => {
      const ident = context?.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
    },
  });

  const removeMutation = useMutation({
    scope: { id: 'basket-mutations' },
    mutationFn: async (): Promise<Basket> => {
      const ident = basketIdentRef.current;
      if (ident === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.remove(ident, 'creator-codes', { creator_code: '' });
      return tebex.getBasket(ident);
    },
    onMutate: async () => {
      const ident = basketIdentRef.current;
      if (ident === null) return;
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });

      const previousBasket = queryClient.getQueryData<Basket>(tebexKeys.basket(ident));
      if (previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          creator_code: '',
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _, context) => {
      const ident = context?.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
    },
  });

  const apply = useCallback(
    async (code: string): Promise<void> => {
      await applyMutation.mutateAsync(code);
    },
    [applyMutation],
  );

  const remove = useCallback(async (): Promise<void> => {
    await removeMutation.mutateAsync();
  }, [removeMutation]);

  const combinedError = applyMutation.error ?? removeMutation.error;
  const error = useMemo(
    () => (combinedError !== null ? TebexError.fromUnknown(combinedError) : null),
    [combinedError],
  );

  return {
    creatorCode: basket?.creator_code ?? null,
    apply,
    remove,
    isApplying: applyMutation.isPending,
    isRemoving: removeMutation.isPending,
    error,
    errorCode: error?.code ?? null,
  };
}
