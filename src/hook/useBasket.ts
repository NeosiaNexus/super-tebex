import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Basket, InBasket, Package, PackageType } from 'tebex_headless';
import basketService from '../services/basketService';
import { useShopBasketStore, useShopUserStore } from '../store';
import useCreateBasket from './useCreateBasket';

interface UseBasketResult {
  basket: Basket | null;
  loading: boolean;
  error: Error | null;
  addPackageToBasket: (
    packageId: Package['id'],
    quantity?: InBasket['quantity'],
    type?: PackageType,
    variableData?: Record<string, string>,
  ) => Promise<void>;
  removePackageFromBasket: (packageId: Package['id']) => Promise<void>;
  updateManualBasket: (basket: Basket | null) => void;
  refetch: () => void;
}

const useBasket = (username: string | null): UseBasketResult => {
  const basketIdent = useShopBasketStore(s => s.basketIdent);
  const setBasketIdent = useShopBasketStore(s => s.setBasketIdent);
  const storeUsername = useShopUserStore(s => s.username);

  const [basket, setBasket] = useState<Basket | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isQuantityUpdating, setIsQuantityUpdating] = useState<boolean>(false);

  const createBasket = useCreateBasket(username ?? storeUsername);

  const fetchBasket = async (ident: string): Promise<void> => {
    setLoading(true);
    try {
      const data = await basketService.getBasket(ident);
      if (data.complete) {
        setBasket(null);
        setBasketIdent('');
        return;
      }
      setBasket(data);
      setBasketIdent(data.ident);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setBasket(null);
      setBasketIdent('');
    } finally {
      setLoading(false);
    }
  };

  const addPackageToBasket = async (
    packageId: Package['id'],
    quantity?: InBasket['quantity'],
    type?: PackageType,
    variableData?: Record<string, string>,
  ): Promise<void> => {
    if (isQuantityUpdating) return;

    try {
      setIsQuantityUpdating(true);
      if (!username && !storeUsername) {
        toast.error('Vous devez vous connecter pour ajouter des articles à votre panier');
        return;
      }

      let created: Basket['ident'] | null = null;

      if (!basketIdent) {
        created = (await createBasket())?.ident ?? null;
        if (!created) {
          toast.error('Une erreur est survenue lors de la création du panier');
          return;
        }
        setBasketIdent(created);
        await fetchBasket(created);
      } else {
        await fetchBasket(basketIdent);

        created = basketIdent;
      }

      if (!created) {
        toast.error(
          "Vous n'avez pas de panier. Si le problème persiste, veuillez vous rapprocher du support.",
        );
        return;
      }

      const updated = basketService
        .addPackageToBasket(created, packageId, quantity, type, variableData)
        ?.then(updated => {
          setBasket(updated);
          refetch();
        });

      toast.promise(updated, {
        loading: "Ajout de l'article dans votre panier...",
        success: 'Article ajouté avec succès !',
        error: "Une erreur est survenue lors de l'ajout de l'article dans votre panier",
      });
    } finally {
      setIsQuantityUpdating(false);
    }
  };

  const removePackageFromBasket = async (packageId: Package['id']): Promise<void> => {
    if (isQuantityUpdating) return;

    try {
      setIsQuantityUpdating(true);

      if (!basketIdent) {
        toast.error(
          "Vous n'avez pas de panier. Si le problème persiste, veuillez vous rapprocher du support.",
        );
        return;
      }

      const updated = basketService
        .removePackageFromBasket(
          basketIdent,
          packageId,
          basket?.packages.find(p => p.id === packageId)?.in_basket.quantity ?? 0,
        )
        ?.then(updated => {
          setBasket(updated);
          refetch();
        });

      toast.promise(updated, {
        loading: "Suppression de l'article de votre panier...",
        success: 'Article supprimé avec succès !',
        error: "Une erreur est survenue lors de la suppression de l'article de votre panier",
      });
    } finally {
      setIsQuantityUpdating(false);
    }
  };

  const refetch = (): void => {
    if (basketIdent) void fetchBasket(basketIdent);
  };

  const updateManualBasket = (basket: Basket | null): void => {
    setBasket(basket);
  };

  useEffect(() => {
    if (!basketIdent) return;
    void fetchBasket(basketIdent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basketIdent]);

  return {
    basket,
    loading,
    error,
    updateManualBasket,
    addPackageToBasket,
    removePackageFromBasket,
    refetch,
  };
};

export default useBasket;
