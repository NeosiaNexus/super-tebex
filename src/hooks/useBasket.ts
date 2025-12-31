'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { Basket, BasketPackage } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import { useUserStore } from '../stores/userStore';
import type { AddPackageParams, UpdateQuantityParams, UseBasketReturn } from '../types/hooks';

/**
 * Hook to manage the shopping basket with optimistic updates.
 *
 * @returns Basket data, actions, and computed values
 *
 * @example
 * ```tsx
 * const {
 *   basket,
 *   packages,
 *   addPackage,
 *   removePackage,
 *   itemCount,
 *   total,
 *   isAddingPackage,
 * } = useBasket();
 *
 * const handleAddToCart = async (packageId: number) => {
 *   await addPackage({ packageId, quantity: 1 });
 * };
 * ```
 */
export function useBasket(): UseBasketReturn {
  const config = useTebexConfig();
  const queryClient = useQueryClient();

  // Store selectors
  const basketIdent = useBasketStore(state => state.basketIdent);
  const setBasketIdent = useBasketStore(state => state.setBasketIdent);
  const clearBasketIdent = useBasketStore(state => state.clearBasketIdent);
  const username = useUserStore(state => state.username);

  // Query: Fetch basket
  const basketQuery = useQuery({
    queryKey: tebexKeys.basket(basketIdent),
    queryFn: async (): Promise<Basket | null> => {
      if (basketIdent === null) {
        return null;
      }
      const tebex = getTebexClient();
      return tebex.getBasket(basketIdent);
    },
    enabled: basketIdent !== null,
  });

  // Helper to create basket if needed
  const ensureBasket = useCallback(async (): Promise<string> => {
    if (basketIdent !== null) {
      return basketIdent;
    }

    if (username === null || username.length === 0) {
      throw new TebexError(
        TebexErrorCode.NOT_AUTHENTICATED,
        'Username is required to create a basket',
      );
    }

    const tebex = getTebexClient();
    const newBasket = await tebex.createMinecraftBasket(
      username,
      config.completeUrl,
      config.cancelUrl,
    );

    setBasketIdent(newBasket.ident);
    return newBasket.ident;
  }, [basketIdent, username, config.completeUrl, config.cancelUrl, setBasketIdent]);

  // Mutation: Add package with optimistic update
  const addMutation = useMutation({
    mutationFn: async (params: AddPackageParams): Promise<Basket> => {
      const ident = await ensureBasket();
      const tebex = getTebexClient();

      await tebex.addPackageToBasket(
        ident,
        params.packageId,
        params.quantity ?? 1,
        params.type,
        params.variableData,
      );

      // Return updated basket
      return tebex.getBasket(ident);
    },
    onMutate: async params => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(basketIdent) });

      // Snapshot previous value
      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(basketIdent));

      // Optimistically update (if we have a basket)
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
            gift_username: null,
          },
        };

        const existingIndex = previousBasket.packages.findIndex(p => p.id === params.packageId);

        const newPackages =
          existingIndex >= 0
            ? previousBasket.packages.map((p, i) =>
                i === existingIndex
                  ? {
                      ...p,
                      in_basket: {
                        ...p.in_basket,
                        quantity: p.in_basket.quantity + (params.quantity ?? 1),
                      },
                    }
                  : p,
              )
            : [...previousBasket.packages, optimisticPackage];

        queryClient.setQueryData<Basket>(tebexKeys.basket(basketIdent), {
          ...previousBasket,
          packages: newPackages,
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
      // Update with real data
      queryClient.setQueryData(tebexKeys.basket(basketIdent), data);
    },
  });

  // Mutation: Remove package with optimistic update
  const removeMutation = useMutation({
    mutationFn: async (packageId: number): Promise<Basket> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.removePackage(basketIdent, packageId);
      return tebex.getBasket(basketIdent);
    },
    onMutate: async packageId => {
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(basketIdent) });

      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(basketIdent));

      if (previousBasket !== null && previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(basketIdent), {
          ...previousBasket,
          packages: previousBasket.packages.filter(p => p.id !== packageId),
        });
      }

      return { previousBasket };
    },
    onError: (_error, _packageId, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(basketIdent), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: data => {
      queryClient.setQueryData(tebexKeys.basket(basketIdent), data);
    },
  });

  // Mutation: Update quantity with optimistic update
  const updateQuantityMutation = useMutation({
    mutationFn: async (params: UpdateQuantityParams): Promise<Basket> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.updateQuantity(basketIdent, params.packageId, params.quantity);
      return tebex.getBasket(basketIdent);
    },
    onMutate: async params => {
      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(basketIdent) });

      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(basketIdent));

      if (previousBasket !== null && previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(basketIdent), {
          ...previousBasket,
          packages: previousBasket.packages.map(p =>
            p.id === params.packageId
              ? { ...p, in_basket: { ...p.in_basket, quantity: params.quantity } }
              : p,
          ),
        });
      }

      return { previousBasket };
    },
    onError: (_error, _params, context) => {
      if (context?.previousBasket !== undefined) {
        queryClient.setQueryData(tebexKeys.basket(basketIdent), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: data => {
      queryClient.setQueryData(tebexKeys.basket(basketIdent), data);
    },
  });

  // Clear basket action
  const clearBasket = useCallback(() => {
    clearBasketIdent();
    queryClient.removeQueries({ queryKey: tebexKeys.baskets() });
  }, [clearBasketIdent, queryClient]);

  // Computed values
  const basket = basketQuery.data ?? null;

  const packages = useMemo(() => basket?.packages ?? [], [basket?.packages]);

  const itemCount = useMemo(
    () => packages.reduce((acc, pkg) => acc + pkg.in_basket.quantity, 0),
    [packages],
  );

  const total = useMemo(() => basket?.total_price ?? 0, [basket]);

  const error = useMemo(
    () => (basketQuery.error !== null ? TebexError.fromUnknown(basketQuery.error) : null),
    [basketQuery.error],
  );

  // Wrapped actions that return void promises
  const addPackage = useCallback(
    async (params: AddPackageParams): Promise<void> => {
      await addMutation.mutateAsync(params);
    },
    [addMutation],
  );

  const removePackage = useCallback(
    async (packageId: number): Promise<void> => {
      await removeMutation.mutateAsync(packageId);
    },
    [removeMutation],
  );

  const updateQuantity = useCallback(
    async (params: UpdateQuantityParams): Promise<void> => {
      await updateQuantityMutation.mutateAsync(params);
    },
    [updateQuantityMutation],
  );

  return {
    // Data
    basket,
    data: basket,
    basketIdent,
    packages,

    // States
    isLoading: basketQuery.isLoading,
    isFetching: basketQuery.isFetching,
    isAddingPackage: addMutation.isPending,
    isRemovingPackage: removeMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,

    // Errors
    error,
    errorCode: error?.code ?? null,

    // Actions
    addPackage,
    removePackage,
    updateQuantity,
    clearBasket,
    refetch: basketQuery.refetch,

    // Computed
    itemCount,
    total,
    isEmpty: packages.length === 0,
  };
}
