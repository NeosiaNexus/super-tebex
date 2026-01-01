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

        tebexCheckout.init({ ident: basketIdent });

        tebexCheckout.on('payment:complete', () => {
          clearBasket();
          options.onSuccess?.();
          resolve();
        });

        tebexCheckout.on('payment:error', data => {
          const error = new TebexError(TebexErrorCode.CHECKOUT_FAILED, String(data));
          options.onError?.(error);
          config.onError?.(error);
          reject(error);
        });

        tebexCheckout.on('close', () => {
          options.onClose?.();
          // Resolve the promise when the modal is closed
          // If payment:complete or payment:error already resolved/rejected, this is a no-op
          resolve();
        });

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
