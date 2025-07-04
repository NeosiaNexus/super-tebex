import { useCallback } from 'react';
import { toast } from 'sonner';
import { Basket } from 'tebex_headless';
import { basketService } from '../services';
import { useShopBasketStore, useShopUserStore } from '../store';
import useShopUiStore from '../store/shopUiStore';

interface GetShopUrlsResult {
  completeUrl: string;
  cancelUrl: string;
}

export interface UseCreateBasketDeps {
  isCreatingBasket: boolean;
  setIsCreatingBasket: (state: boolean) => void;
  setBasketIdent: (ident: string) => void;
  createBasket: (props: {
    username: string;
    completeUrl: string;
    cancelUrl: string;
    completeAutoRedirect: boolean;
    ipAddress: string;
  }) => Promise<Basket>;
}

export const createBasketFlow = async (
  deps: UseCreateBasketDeps & { username: string },
): Promise<Basket | null> => {
  const { isCreatingBasket, setIsCreatingBasket, setBasketIdent, createBasket, username } = deps;

  if (isCreatingBasket) return null;

  const { completeUrl, cancelUrl } = getShopUrls();

  try {
    setIsCreatingBasket(true);

    const basket = await createBasket({
      username,
      completeUrl,
      cancelUrl,
      completeAutoRedirect: false,
      ipAddress: '',
    });

    if (!basket?.ident) {
      toast.error('Une erreur est survenue lors de la création du panier');
      return null;
    }

    setBasketIdent(basket.ident);
    return basket;
  } catch {
    toast.error(
      'Erreur lors de la création du panier. Contactez le support si le problème persiste.',
    );
    return null;
  } finally {
    setIsCreatingBasket(false);
  }
};

const useCreateBasket = (username: string | null): (() => Promise<Basket | null>) => {
  const isCreatingBasket = useShopUiStore(s => s.isCreatingBasket);
  const setIsCreatingBasket = useShopUiStore(s => s.setIsCreatingBasket);
  const setBasketIdent = useShopBasketStore(s => s.setBasketIdent);
  const storeUsername = useShopUserStore(s => s.username);

  const create = useCallback(
    () =>
      createBasketFlow({
        isCreatingBasket,
        setIsCreatingBasket,
        setBasketIdent,
        createBasket: basketService.createBasket,
        username: username ?? storeUsername,
      }),
    [isCreatingBasket, setIsCreatingBasket, setBasketIdent, username, storeUsername],
  );

  return create;
};

const getShopUrls = (): GetShopUrlsResult => {
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }

  return {
    completeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shop/complete-purchase`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shop/cancel-purchase`,
  };
};

export default useCreateBasket;
