import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, vi } from 'vitest';
import useCreateBasket, { createBasketFlow } from '../useCreateBasket';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

vi.mock('../store/shopUiStore', () => ({
  default: vi.fn().mockImplementation(selector =>
    selector({
      isCreatingBasket: false,
      setIsCreatingBasket: vi.fn(),
    }),
  ),
}));

vi.mock('../store', () => ({
  useShopBasketStore: vi.fn().mockImplementation(selector =>
    selector({
      setBasketIdent: vi.fn(),
    }),
  ),
}));

vi.mock('../services', () => ({
  basketService: {
    createBasket: vi.fn().mockResolvedValue({ ident: 'abc123' }),
  },
}));

describe('createBasketFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('Success cases', () => {
    it('creates a basket and updates state', async () => {
      const deps = {
        username: 'test',
        isCreatingBasket: false,
        setIsCreatingBasket: vi.fn(),
        setBasketIdent: vi.fn(),
        createBasket: vi.fn().mockResolvedValue({ ident: 'abc123' }),
      };

      const result = await createBasketFlow(deps);

      expect(deps.username).toBe('test');
      expect(deps.setIsCreatingBasket).toHaveBeenCalledWith(true);
      expect(deps.setBasketIdent).toHaveBeenCalledWith('abc123');
      expect(deps.setIsCreatingBasket).toHaveBeenCalledWith(false);
      expect(result).toEqual({ ident: 'abc123' });
    });

    it('completes in under 500ms', async () => {
      const deps = {
        username: 'test',
        isCreatingBasket: false,
        setIsCreatingBasket: vi.fn(),
        setBasketIdent: vi.fn(),
        createBasket: vi.fn().mockResolvedValue({ ident: '123' }),
      };

      const start = performance.now();
      await createBasketFlow(deps);
      expect(performance.now() - start).toBeLessThan(500);
    });
  });

  describe('Guard clauses', () => {
    it('returns null if already creating a basket', async () => {
      const deps = {
        username: 'test',
        isCreatingBasket: true,
        setIsCreatingBasket: vi.fn(),
        setBasketIdent: vi.fn(),
        createBasket: vi.fn(),
      };

      const result = await createBasketFlow(deps);

      expect(result).toBeNull();
      expect(deps.createBasket).not.toHaveBeenCalled();
    });

    it('ignores concurrent calls', async () => {
      const deps = {
        username: 'test',
        isCreatingBasket: false,
        setIsCreatingBasket: vi.fn(),
        setBasketIdent: vi.fn(),
        createBasket: vi.fn().mockResolvedValue({ ident: 'batch' }),
      };

      await Promise.all([
        createBasketFlow(deps),
        createBasketFlow({ ...deps, isCreatingBasket: true }),
      ]);

      expect(deps.createBasket).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('shows toast and returns null if basket has no ident', async () => {
      const deps = {
        username: 'test',
        isCreatingBasket: false,
        setIsCreatingBasket: vi.fn(),
        setBasketIdent: vi.fn(),
        createBasket: vi.fn().mockResolvedValue({}),
      };

      const result = await createBasketFlow(deps);

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Une erreur est survenue lors de la création du panier'),
      );
    });

    it('shows toast if createBasket throws', async () => {
      const deps = {
        username: 'test',
        isCreatingBasket: false,
        setIsCreatingBasket: vi.fn(),
        setBasketIdent: vi.fn(),
        createBasket: vi.fn().mockRejectedValue(new Error('Failure')),
      };

      const result = await createBasketFlow(deps);

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Erreur lors de la création du panier. Contactez le support si le problème persiste.',
        ),
      );
    });
  });

  describe('URL handling', () => {
    it('throws if NEXT_PUBLIC_APP_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      const deps = {
        username: 'test',
        isCreatingBasket: false,
        setIsCreatingBasket: vi.fn(),
        setBasketIdent: vi.fn(),
        createBasket: vi.fn(),
      };

      await expect(() => createBasketFlow(deps)).rejects.toThrow('NEXT_PUBLIC_APP_URL is not set');
    });

    it('uses default env URLs if no props given', async () => {
      const deps = {
        username: 'test',
        isCreatingBasket: false,
        setIsCreatingBasket: vi.fn(),
        setBasketIdent: vi.fn(),
        createBasket: vi.fn().mockResolvedValue({ ident: 'default' }),
      };

      await createBasketFlow(deps);

      expect(deps.createBasket).toHaveBeenCalledWith({
        username: 'test',
        completeUrl: 'https://app.example.com/shop/complete-purchase',
        cancelUrl: 'https://app.example.com/shop/cancel-purchase',
        completeAutoRedirect: false,
        ipAddress: '',
      });
    });
  });

  describe('useCreateBasket hook', () => {
    it('returns a callable function', async () => {
      const { result } = renderHook(() => useCreateBasket());
      expect(typeof result.current).toBe('function');
      await result.current();
    });
  });
});
