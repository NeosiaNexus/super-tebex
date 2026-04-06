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
import { isNonEmptyString } from '../types/guards';
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
  const basketIdentRef = useRef(basketIdent);
  basketIdentRef.current = basketIdent;
  const queryClient = useQueryClient();
  const config = useTebexConfig();

  const applyMutation = useMutation({
    scope: { id: 'basket-mutations' },
    mutationFn: async (couponCode: string): Promise<Basket> => {
      if (!isNonEmptyString(couponCode.trim())) {
        throw new TebexError(TebexErrorCode.COUPON_INVALID, 'Coupon code must be a non-empty string');
      }
      const ident = basketIdentRef.current;
      if (ident === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.apply(ident, 'coupons', { coupon_code: couponCode });
      return tebex.getBasket(ident);
    },
    onMutate: async couponCode => {
      const ident = basketIdentRef.current;
      if (ident === null) return;
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });
      const previousBasket = queryClient.getQueryData<Basket>(tebexKeys.basket(ident));
      if (previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          coupons: [...previousBasket.coupons, { code: couponCode }],
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _couponCode, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _couponCode, context) => {
      const ident = context?.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
    },
  });

  const removeMutation = useMutation({
    scope: { id: 'basket-mutations' },
    mutationFn: async (couponCode: string): Promise<Basket> => {
      if (!isNonEmptyString(couponCode.trim())) {
        throw new TebexError(TebexErrorCode.COUPON_INVALID, 'Coupon code must be a non-empty string');
      }
      const ident = basketIdentRef.current;
      if (ident === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.remove(ident, 'coupons', { coupon_code: couponCode });
      return tebex.getBasket(ident);
    },
    onMutate: async couponCode => {
      const ident = basketIdentRef.current;
      if (ident === null) return;
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });
      const previousBasket = queryClient.getQueryData<Basket>(tebexKeys.basket(ident));
      if (previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          coupons: previousBasket.coupons.filter(c => c.code !== couponCode),
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _couponCode, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _couponCode, context) => {
      const ident = context?.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
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
