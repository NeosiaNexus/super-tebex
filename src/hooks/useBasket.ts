'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Basket, BasketPackage } from 'tebex_headless';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebexClient } from '../services/api';
import { useBasketStore } from '../stores/basketStore';
import { useUserStore } from '../stores/userStore';
import { isPositiveInteger } from '../types/guards';
import type { AddPackageParams, UpdateQuantityParams, UseBasketReturn } from '../types/hooks';

/**
 * Singleton promise for basket creation to prevent race conditions.
 * Concurrent addPackage calls share the same creation promise
 * instead of creating multiple baskets.
 */
let basketCreationPromise: Promise<string> | null = null;

/** Mutation context for optimistic update rollback. */
interface BasketMutationContext {
  previousBasket: Basket | null | undefined;
  ident: string | null;
}

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

  const basketIdent = useBasketStore(state => state.basketIdent);
  const setBasketIdent = useBasketStore(state => state.setBasketIdent);
  const clearBasketIdent = useBasketStore(state => state.clearBasketIdent);
  const username = useUserStore(state => state.username);

  // Ref to avoid stale closure in mutation callbacks
  const basketIdentRef = useRef(basketIdent);
  basketIdentRef.current = basketIdent;

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
    retry: (failureCount, error) => {
      const tebexError = TebexError.fromUnknown(error);
      if (
        tebexError.code === TebexErrorCode.BASKET_NOT_FOUND ||
        tebexError.code === TebexErrorCode.BASKET_EXPIRED
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  useEffect(() => {
    if (basketQuery.error !== null) {
      const tebexError = TebexError.fromUnknown(basketQuery.error);
      if (
        tebexError.code === TebexErrorCode.BASKET_NOT_FOUND ||
        tebexError.code === TebexErrorCode.BASKET_EXPIRED
      ) {
        clearBasketIdent();
      }
    }
  }, [basketQuery.error, clearBasketIdent]);

  const ensureBasket = useCallback(async (): Promise<string> => {
    const currentIdent = useBasketStore.getState().basketIdent;
    if (currentIdent !== null) return currentIdent;

    if (basketCreationPromise !== null) return basketCreationPromise;

    const createBasket = async (): Promise<string> => {
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
    };

    basketCreationPromise = createBasket().finally(() => {
      basketCreationPromise = null;
    });

    return basketCreationPromise;
  }, [username, config.completeUrl, config.cancelUrl, setBasketIdent]);

  const addMutation = useMutation<Basket, Error, AddPackageParams, BasketMutationContext>({
    scope: { id: 'basket-mutations' },
    mutationFn: async (params: AddPackageParams): Promise<Basket> => {
      const quantity = params.quantity ?? 1;

      if (!isPositiveInteger(quantity)) {
        throw new TebexError(
          TebexErrorCode.INVALID_QUANTITY,
          'Quantity must be a positive integer',
        );
      }

      const ident = await ensureBasket();
      const tebex = getTebexClient();

      await tebex.addPackageToBasket(
        ident,
        params.packageId,
        quantity,
        params.type,
        params.variableData,
      );

      return tebex.getBasket(ident);
    },
    onMutate: async (params): Promise<BasketMutationContext> => {
      const ident = basketIdentRef.current;

      if (ident === null) {
        return { previousBasket: undefined, ident };
      }

      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });
      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(ident));

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

        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          packages: newPackages,
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _params, context) => {
      if (context?.previousBasket !== undefined && context.ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _params, context) => {
      const ident = context.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
    },
  });

  const removeMutation = useMutation<Basket, Error, number, BasketMutationContext>({
    scope: { id: 'basket-mutations' },
    mutationFn: async (packageId: number): Promise<Basket> => {
      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.removePackage(basketIdent, packageId);
      return tebex.getBasket(basketIdent);
    },
    onMutate: async (packageId): Promise<BasketMutationContext> => {
      const ident = basketIdentRef.current;

      if (ident === null) {
        return { previousBasket: undefined, ident };
      }

      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });

      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(ident));

      if (previousBasket !== null && previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          packages: previousBasket.packages.filter(p => p.id !== packageId),
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _packageId, context) => {
      if (context?.previousBasket !== undefined && context.ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _packageId, context) => {
      const ident = context.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
    },
  });

  const updateQuantityMutation = useMutation<Basket, Error, UpdateQuantityParams, BasketMutationContext>({
    scope: { id: 'basket-mutations' },
    mutationFn: async (params: UpdateQuantityParams): Promise<Basket> => {
      if (!isPositiveInteger(params.quantity)) {
        throw new TebexError(
          TebexErrorCode.INVALID_QUANTITY,
          'Quantity must be a positive integer',
        );
      }

      if (basketIdent === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebexClient();
      await tebex.updateQuantity(basketIdent, params.packageId, params.quantity);
      return tebex.getBasket(basketIdent);
    },
    onMutate: async (params): Promise<BasketMutationContext> => {
      const ident = basketIdentRef.current;

      if (ident === null) {
        return { previousBasket: undefined, ident };
      }

      await queryClient.cancelQueries({ queryKey: tebexKeys.basket(ident) });

      const previousBasket = queryClient.getQueryData<Basket | null>(tebexKeys.basket(ident));

      if (previousBasket !== null && previousBasket !== undefined) {
        queryClient.setQueryData<Basket>(tebexKeys.basket(ident), {
          ...previousBasket,
          packages: previousBasket.packages.map(p =>
            p.id === params.packageId
              ? { ...p, in_basket: { ...p.in_basket, quantity: params.quantity } }
              : p,
          ),
        });
      }

      return { previousBasket, ident };
    },
    onError: (_error, _params, context) => {
      if (context?.previousBasket !== undefined && context.ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(context.ident), context.previousBasket);
      }
      config.onError?.(TebexError.fromUnknown(_error));
    },
    onSuccess: (data, _params, context) => {
      const ident = context.ident ?? basketIdentRef.current;
      if (ident !== null) {
        queryClient.setQueryData(tebexKeys.basket(ident), data);
      }
    },
  });

  const clearBasket = useCallback(() => {
    clearBasketIdent();
    queryClient.removeQueries({ queryKey: tebexKeys.baskets() });
  }, [clearBasketIdent, queryClient]);

  const basket = basketQuery.data ?? null;

  const packages = useMemo(() => basket?.packages ?? [], [basket?.packages]);

  const itemCount = useMemo(
    () => packages.reduce((acc, pkg) => acc + pkg.in_basket.quantity, 0),
    [packages],
  );

  const total = useMemo(() => basket?.total_price ?? 0, [basket?.total_price]);

  const combinedError =
    basketQuery.error ??
    addMutation.error ??
    removeMutation.error ??
    updateQuantityMutation.error;
  const wrappedError = useMemo(
    () => (combinedError !== null ? TebexError.fromUnknown(combinedError) : null),
    [combinedError],
  );

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
    basket,
    data: basket,
    basketIdent,
    packages,
    isLoading: basketQuery.isLoading,
    isFetching: basketQuery.isFetching,
    isAddingPackage: addMutation.isPending,
    isRemovingPackage: removeMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    error: wrappedError,
    errorCode: wrappedError?.code ?? null,
    addPackage,
    removePackage,
    updateQuantity,
    clearBasket,
    refetch: basketQuery.refetch,
    itemCount,
    total,
    isEmpty: packages.length === 0,
  };
}
