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
import type { UseCouponsReturn } from '../types/hooks';
import { useBasket } from './useBasket';

/**
 * Hook to manage coupons on the basket with optimistic updates.
 *
 * @returns Coupon state and actions
 *
 * @example
 * ```tsx
 * const { coupons, apply, remove, isApplying } = useCoupons();
 *
 * const handleApply = async (code: string) => {
 *   try {
 *     await apply(code);
 *     toast.success('Coupon applied!');
 *   } catch (error) {
 *     toast.error('Invalid coupon');
 *   }
 * };
 * ```
 */
export function useCoupons(): UseCouponsReturn {
  const { basket } = useBasket();
  const basketIdent = useBasketStore(state => state.basketIdent);
  const queryClient = useQueryClient();
  const config = useTebexConfig();

  const applyMutation = useMutation({
    mutationFn: async (couponCode: string): Promise<Basket> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.apply(basketIdent, 'coupons', { coupon_code: couponCode });
      // Return updated basket for cache sync
      return tebex.getBasket(basketIdent);
    },
    onMutate: async couponCode => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(basketIdent) });

      // Snapshot previous value for rollback
      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(basketIdent));

      // Optimistically add the coupon
      if (previousBasket !== null && previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(basketIdent), {
          ...previousBasket,
          coupons: [...previousBasket.coupons, { code: couponCode }],
        });
      }

      return { previousBasket };
    },
    onError: (_error, _couponCode, context) => {
      // Rollback on error
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(basketIdent), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: data => {
      // Sync with server response (includes recalculated prices)
      queryClient.setQueryData(tebexKeys.basket(basketIdent), data);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (couponCode: string): Promise<Basket> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.remove(basketIdent, 'coupons', { coupon_code: couponCode });
      // Return updated basket for cache sync
      return tebex.getBasket(basketIdent);
    },
    onMutate: async couponCode => {
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(basketIdent) });

      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(basketIdent));

      // Optimistically remove the coupon
      if (previousBasket !== null && previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(basketIdent), {
          ...previousBasket,
          coupons: previousBasket.coupons.filter(c => c.code !== couponCode),
        });
      }

      return { previousBasket };
    },
    onError: (_error, _couponCode, context) => {
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
    async (couponCode: string): Promise<void> => {
      await applyMutation.mutateAsync(couponCode);
    },
    [applyMutation],
  );

  const remove = useCallback(
    async (couponCode: string): Promise<void> => {
      await removeMutation.mutateAsync(couponCode);
    },
    [removeMutation],
  );

  const combinedError = applyMutation.error ?? removeMutation.error;
  const error = useMemo(
    () => (combinedError !== null ? TebexError.fromUnknown(combinedError) : null),
    [combinedError],
  );

  return {
    coupons: basket?.coupons ?? [],
    apply,
    remove,
    isApplying: applyMutation.isPending,
    isRemoving: removeMutation.isPending,
    error,
    errorCode: error?.code ?? null,
  };
}
