'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import type { UseCreatorCodesReturn } from '../types/hooks';
import { useBasket } from './useBasket';

/**
 * Hook to manage creator codes on the basket.
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
  const queryClient = useQueryClient();
  const config = useTebexConfig();

  const applyMutation = useMutation({
    mutationFn: async (code: string): Promise<void> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.apply(basketIdent, 'creator-codes', { creator_code: code });
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
    mutationFn: async (): Promise<void> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      // Creator codes are removed by passing an empty creator_code
      await tebex.remove(basketIdent, 'creator-codes', { creator_code: '' });
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
