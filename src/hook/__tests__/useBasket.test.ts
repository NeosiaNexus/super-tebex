import { act, renderHook } from '@testing-library/react';
import type { Basket, InBasket } from 'tebex_headless';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

// --- State variables (must be defined before vi.mock) ---
let basketStoreState: { basketIdent: string | null };
let userStoreState: { username: string };
let mockSetBasketIdent: ReturnType<typeof vi.fn>;
let mockClearBasketIdent: ReturnType<typeof vi.fn>;

// --- Mocks ---
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    promise: vi.fn((promise: Promise<unknown>) => promise),
  },
}));

vi.mock('../../store', () => ({
  useShopBasketStore: vi.fn().mockImplementation((selector: (state: unknown) => unknown) =>
    selector({
      get basketIdent() {
        return basketStoreState.basketIdent;
      },
      setBasketIdent: (ident: string) => {
        basketStoreState.basketIdent = ident;
        mockSetBasketIdent(ident);
      },
      clearBasketIdent: () => {
        basketStoreState.basketIdent = null;
        mockClearBasketIdent();
      },
    }),
  ),
  useShopUserStore: vi.fn().mockImplementation((selector: (state: unknown) => unknown) =>
    selector({
      get username() {
        return userStoreState.username;
      },
      setUsername: (name: string) => {
        userStoreState.username = name;
      },
      clearUsername: () => {
        userStoreState.username = '';
      },
    }),
  ),
}));

vi.mock('../../hook/useCreateBasket', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../services/basketService', () => ({
  __esModule: true,
  default: {
    getBasket: vi.fn(),
    addPackageToBasket: vi.fn(),
    removePackageFromBasket: vi.fn(),
  },
}));

import { toast } from 'sonner';
import useBasket from '../../hook/useBasket';
import useCreateBasket from '../../hook/useCreateBasket';
import basketService from '../../services/basketService';

const mockedUseCreateBasket = useCreateBasket as unknown as Mock;
const mockedGetBasket = basketService.getBasket as unknown as Mock;
const mockedAddPackage = basketService.addPackageToBasket as unknown as Mock;
const mockedRemovePackage = basketService.removePackageFromBasket as unknown as Mock;

describe('useBasket', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    basketStoreState = { basketIdent: null };
    userStoreState = { username: '' };
    mockSetBasketIdent = vi.fn();
    mockClearBasketIdent = vi.fn();

    // Reconfigurer le mock pour s'assurer qu'il utilise toujours les dernières valeurs
    const { useShopBasketStore, useShopUserStore } = await import('../../store');
    (useShopBasketStore as unknown as Mock).mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          get basketIdent() {
            return basketStoreState.basketIdent;
          },
          setBasketIdent: (ident: string) => {
            basketStoreState.basketIdent = ident;
            mockSetBasketIdent(ident);
          },
          clearBasketIdent: () => {
            basketStoreState.basketIdent = null;
            mockClearBasketIdent();
          },
        }),
    );
    (useShopUserStore as unknown as Mock).mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          get username() {
            return userStoreState.username;
          },
          setUsername: (name: string) => {
            userStoreState.username = name;
          },
          clearUsername: () => {
            userStoreState.username = '';
          },
        }),
    );
  });

  it('initialises with default state', () => {
    const { result } = renderHook(() => useBasket(null));
    expect(result.current.basket).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches basket via refetch when basketIdent is set and basket is not complete', async () => {
    basketStoreState.basketIdent = 'basket-1';

    const fakeBasket: Basket = {
      ident: 'basket-1',
      complete: false,
      packages: [],
    } as unknown as Basket;

    mockedGetBasket.mockResolvedValue(fakeBasket);

    const { result } = renderHook(() => useBasket('player'));

    // Attendre que le useEffect initial se termine
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockedGetBasket).toHaveBeenCalledWith('basket-1');
    expect(result.current.basket).toEqual(fakeBasket);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockSetBasketIdent).toHaveBeenCalledWith('basket-1');
    expect(mockClearBasketIdent).not.toHaveBeenCalled();
  });

  it('clears basket and ident when fetched basket is complete', async () => {
    basketStoreState.basketIdent = 'basket-complete';

    const completeBasket: Basket = {
      ident: 'basket-complete',
      complete: true,
      packages: [],
    } as unknown as Basket;

    mockedGetBasket.mockResolvedValue(completeBasket);

    const { result } = renderHook(() => useBasket('player'));

    // Attendre que le useEffect initial se termine
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.basket).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockClearBasketIdent).toHaveBeenCalled();
  });

  it('sets error and clears ident when getBasket throws', async () => {
    basketStoreState.basketIdent = 'basket-error';
    mockedGetBasket.mockRejectedValue(new Error('fetch failed'));

    const { result } = renderHook(() => useBasket('player'));

    // Attendre que le useEffect initial se termine
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.basket).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('fetch failed');
    expect(mockClearBasketIdent).toHaveBeenCalled();
  });

  it('prevents adding package when user is not logged in', async () => {
    const { result } = renderHook(() => useBasket(null));

    await act(async () => {
      await result.current.addPackageToBasket(1);
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Vous devez vous connecter pour ajouter des articles à votre panier',
    );
    expect(mockedAddPackage).not.toHaveBeenCalled();
  });

  it('creates basket if none exists and then adds package', async () => {
    basketStoreState.basketIdent = null;
    userStoreState.username = 'player';

    const createBasketFn = vi.fn().mockResolvedValue({ ident: 'new-basket' });
    mockedUseCreateBasket.mockReturnValue(createBasketFn);

    const updatedBasket = {
      ident: 'new-basket',
      complete: false,
      packages: [],
    } as unknown as Basket;

    mockedAddPackage.mockResolvedValue(updatedBasket);
    // Mocker getBasket pour éviter que le useEffect déclenché par setBasketIdent ne cause de problème
    mockedGetBasket.mockResolvedValue(updatedBasket);

    const { result } = renderHook(() => useBasket(null));

    await act(async () => {
      await result.current.addPackageToBasket(42, 2);
    });

    // Attendre que les mises à jour d'état soient terminées
    await act(async () => {
      await Promise.resolve();
    });

    expect(createBasketFn).toHaveBeenCalled();
    expect(mockSetBasketIdent).toHaveBeenCalledWith('new-basket');
    expect(mockedAddPackage).toHaveBeenCalledWith('new-basket', 42, 2, undefined, undefined);
    expect(result.current.basket?.ident).toBe('new-basket');
    expect(result.current.error).toBeNull();
  });

  it('shows error toast and aborts if basket creation fails', async () => {
    basketStoreState.basketIdent = null;
    userStoreState.username = 'player';

    const createBasketFn = vi.fn().mockResolvedValue(null);
    mockedUseCreateBasket.mockReturnValue(createBasketFn);

    const { result } = renderHook(() => useBasket(null));

    await act(async () => {
      await result.current.addPackageToBasket(42);
    });

    expect(mockedAddPackage).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Une erreur est survenue lors de la création du panier',
    );
    expect(result.current.basket).toBeNull();
  });

  it('shows error toast when createBasket returns basket without ident', async () => {
    basketStoreState.basketIdent = null;
    userStoreState.username = 'player';

    // Cas où createBasket retourne un panier avec ident null ou undefined (simule la ligne 91-95)
    // On simule un cas où basketIdent serait falsy après assignation (protection défensive)
    const createBasketFn = vi.fn().mockResolvedValue({ ident: null } as unknown as Basket);
    mockedUseCreateBasket.mockReturnValue(createBasketFn);

    const { result } = renderHook(() => useBasket(null));

    await act(async () => {
      await result.current.addPackageToBasket(42);
    });

    expect(mockedAddPackage).not.toHaveBeenCalled();
    // Le code vérifie d'abord à la ligne 80, donc on voit ce message
    expect(toast.error).toHaveBeenCalledWith(
      'Une erreur est survenue lors de la création du panier',
    );
    expect(result.current.basket).toBeNull();
  });

  // Note: Les lignes 91-95 sont une protection défensive qui ne devrait normalement
  // jamais être atteinte car basketIdent est soit null soit une chaîne non vide.
  // Ce code est là pour gérer des cas edge improbables et améliorer la robustesse.

  it('sets error when addPackageToBasket throws an exception', async () => {
    basketStoreState.basketIdent = 'existing-basket';
    userStoreState.username = 'player';

    // Mock useCreateBasket pour éviter l'erreur "createBasket is not a function"
    const createBasketFn = vi.fn().mockResolvedValue({ ident: 'basket-1' } as unknown as Basket);
    mockedUseCreateBasket.mockReturnValue(createBasketFn);

    // Mock getBasket pour éviter que le useEffect initial cause une erreur
    mockedGetBasket.mockResolvedValueOnce({
      ident: 'existing-basket',
      complete: false,
      packages: [],
    } as unknown as Basket);

    // Simuler une erreur lors de l'ajout du package (ligne 115)
    mockedAddPackage.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useBasket(null));

    // Attendre que le useEffect initial se termine
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.addPackageToBasket(42);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
    expect(mockedAddPackage).toHaveBeenCalled();
  });

  it('uses existing basketIdent when adding a package', async () => {
    basketStoreState.basketIdent = 'existing-basket';
    userStoreState.username = 'player';

    mockedAddPackage.mockResolvedValueOnce({
      ident: 'existing-basket',
      complete: false,
      packages: [],
    } as unknown as Basket);

    const { result } = renderHook(() => useBasket(null));

    await act(async () => {
      await result.current.addPackageToBasket(99);
    });

    expect(mockedUseCreateBasket).toHaveBeenCalled();
    expect(mockedAddPackage).toHaveBeenCalledWith(
      'existing-basket',
      99,
      undefined,
      undefined,
      undefined,
    );
  });

  it('shows toast when removing from basket without ident', async () => {
    basketStoreState.basketIdent = null;
    userStoreState.username = 'player';

    const { result } = renderHook(() => useBasket(null));

    await act(async () => {
      await result.current.removePackageFromBasket(5);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Vous n'avez pas de panier. Si le problème persiste, veuillez vous rapprocher du support.",
    );
    expect(mockedRemovePackage).not.toHaveBeenCalled();
  });

  it('removes package using current quantity from basket', async () => {
    userStoreState.username = 'player';
    basketStoreState.basketIdent = 'basket-qty';

    const fakeBasket: Basket = {
      ident: 'basket-qty',
      complete: false,
      packages: [
        {
          id: 10,
          in_basket: { quantity: 3 } as InBasket,
        },
      ],
    } as Basket;

    const updatedBasket: Basket = {
      ident: 'basket-qty',
      complete: false,
      packages: [],
    } as unknown as Basket;

    // Mock getBasket pour éviter que le useEffect ne déclenche un fetch
    mockedGetBasket.mockResolvedValueOnce(fakeBasket);
    mockedRemovePackage.mockResolvedValueOnce(updatedBasket);

    const { result } = renderHook(() => useBasket(null));

    // Attendre que le useEffect initial se termine
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateManualBasket(fakeBasket);
    });

    await act(async () => {
      await result.current.removePackageFromBasket(10);
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(mockedRemovePackage).toHaveBeenCalledWith('basket-qty', 10, 3);
    expect(result.current.basket).toEqual(updatedBasket);
    expect(result.current.error).toBeNull();
  });

  it('sets error when removePackageFromBasket throws a synchronous exception', async () => {
    basketStoreState.basketIdent = 'existing-basket';
    userStoreState.username = 'player';

    const fakeBasket: Basket = {
      ident: 'existing-basket',
      complete: false,
      packages: [
        {
          id: 10,
          in_basket: { quantity: 2 } as InBasket,
        },
      ],
    } as Basket;

    // Mock getBasket pour éviter que le useEffect ne déclenche un fetch
    mockedGetBasket.mockResolvedValueOnce(fakeBasket);

    // Simuler une erreur synchrone (pas asynchrone) pour tester la ligne 151
    // Par exemple, si basketService.removePackageFromBasket lance une erreur synchrone
    mockedRemovePackage.mockImplementation(() => {
      throw new Error('Remove failed');
    });

    const { result } = renderHook(() => useBasket(null));

    // Attendre que le useEffect initial se termine
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateManualBasket(fakeBasket);
    });

    await act(async () => {
      await result.current.removePackageFromBasket(10);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Remove failed');
    expect(mockedRemovePackage).toHaveBeenCalled();
  });

  it('updateManualBasket overrides basket state', () => {
    const fakeBasket: Basket = {
      ident: 'manual',
      complete: false,
      packages: [],
    } as unknown as Basket;

    const { result } = renderHook(() => useBasket('player'));

    act(() => {
      result.current.updateManualBasket(fakeBasket);
    });

    expect(result.current.basket).toEqual(fakeBasket);
  });
});
