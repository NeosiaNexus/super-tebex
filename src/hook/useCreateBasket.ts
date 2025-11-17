import { useCallback } from 'react';
import { toast } from 'sonner';
import { Basket } from 'tebex_headless';
import { shopUrls } from '../client/initShopUrls';
import { basketService } from '../services';
import { useShopBasketStore, useShopUserStore } from '../store';
import useShopUiStore from '../store/shopUiStore';

export interface GetShopUrlsResult {
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
  if (!shopUrls) {
    throw new Error(
      'Shop URLs not initialized. Call initShopUrls(baseUrl, paths?: { complete?: string; cancel?: string }) first.',
    );
  }

  return {
    completeUrl: shopUrls.completeUrl,
    cancelUrl: shopUrls.cancelUrl,
  };
};

export default useCreateBasket;
