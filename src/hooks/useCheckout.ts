'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { TebexError } from '../errors/TebexError';
import { TebexErrorCode } from '../errors/codes';
import { useTebexConfig } from '../provider/TebexProvider';
import type { UseCheckoutOptions, UseCheckoutReturn } from '../types/hooks';
import { useBasket } from './useBasket';

/**
 * Tebex.js checkout interface.
 * Loaded from https://js.tebex.io/v/1.js
 */
interface TebexCheckout {
  init: (options: { ident: string }) => void;
  launch: () => void;
  on: (event: string, callback: (data?: unknown) => void) => void;
  off: (event: string, callback: (data?: unknown) => void) => void;
  close: () => void;
}

declare global {
  interface Window {
    Tebex?: {
      checkout: TebexCheckout;
    };
  }
}

/**
 * Hook to launch the Tebex checkout modal.
 *
 * @param options - Checkout callbacks
 * @returns Checkout state and launch function
 *
 * @example
 * ```tsx
 * const { launch, canCheckout, isLaunching } = useCheckout({
 *   onSuccess: () => router.push('/thank-you'),
 *   onError: (error) => toast.error(error.message),
 * });
 *
 * return (
 *   <button onClick={launch} disabled={!canCheckout || isLaunching}>
 *     Checkout
 *   </button>
 * );
 * ```
 */
export function useCheckout(options: UseCheckoutOptions = {}): UseCheckoutReturn {
  const { basket, basketIdent, clearBasket, isEmpty } = useBasket();
  const config = useTebexConfig();

  const launchMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (basketIdent === null || basket === null) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }

      if (isEmpty) {
        throw new TebexError(TebexErrorCode.BASKET_EMPTY, 'Basket is empty');
      }

      if (typeof window === 'undefined') {
        throw new TebexError(TebexErrorCode.TEBEX_JS_NOT_LOADED, 'Cannot checkout on server side.');
      }

      const tebexGlobal = window.Tebex;
      if (tebexGlobal === undefined) {
        throw new TebexError(
          TebexErrorCode.TEBEX_JS_NOT_LOADED,
          'Tebex.js not loaded. Add <script src="https://js.tebex.io/v/1.js"></script> to your page.',
        );
      }

      return new Promise<void>((resolve, reject) => {
        const tebexCheckout = tebexGlobal.checkout;
        let isSettled = false;

        // Define handlers so we can remove them later
        const handleComplete = (): void => {
          if (isSettled) return;
          isSettled = true;
          cleanup();
          clearBasket();
          options.onSuccess?.();
          resolve();
        };

        const handleError = (data?: unknown): void => {
          if (isSettled) return;
          isSettled = true;
          cleanup();
          const error = new TebexError(TebexErrorCode.CHECKOUT_FAILED, String(data));
          options.onError?.(error);
          config.onError?.(error);
          reject(error);
        };

        const handleClose = (): void => {
          if (isSettled) return;
          isSettled = true;
          cleanup();
          options.onClose?.();
          resolve();
        };

        // Cleanup function to remove all event listeners
        const cleanup = (): void => {
          tebexCheckout.off('payment:complete', handleComplete);
          tebexCheckout.off('payment:error', handleError);
          tebexCheckout.off('close', handleClose);
        };

        tebexCheckout.init({ ident: basketIdent });

        // Register event handlers
        tebexCheckout.on('payment:complete', handleComplete);
        tebexCheckout.on('payment:error', handleError);
        tebexCheckout.on('close', handleClose);

        tebexCheckout.launch();
      });
    },
  });

  const launch = useCallback(async (): Promise<void> => {
    await launchMutation.mutateAsync();
  }, [launchMutation]);

  const error = useMemo(
    () => (launchMutation.error !== null ? TebexError.fromUnknown(launchMutation.error) : null),
    [launchMutation.error],
  );

  return {
    launch,
    isLaunching: launchMutation.isPending,
    error,
    errorCode: error?.code ?? null,
    canCheckout: basket !== null && !isEmpty,
    checkoutUrl: basket?.links.checkout ?? null,
  };
}
