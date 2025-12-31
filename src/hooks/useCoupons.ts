'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import type { UseCouponsReturn } from '../types/hooks';
import { useBasket } from './useBasket';

/**
 * Hook to manage coupons on the basket.
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
    mutationFn: async (couponCode: string): Promise<void> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.apply(basketIdent, 'coupons', { coupon_code: couponCode });
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
    mutationFn: async (couponCode: string): Promise<void> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.remove(basketIdent, 'coupons', { coupon_code: couponCode });
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
