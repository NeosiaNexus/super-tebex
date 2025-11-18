import type { Basket } from 'tebex_headless';
import { Mock, vi } from 'vitest';

import { getTebex } from '../../client';
import basketService from '../basketService';

vi.mock('../../client', () => ({
  getTebex: vi.fn(),
}));

describe('basketService', () => {
  describe('createBasket', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call tebex.createBasket with correct arguments and return basket', async () => {
      const mockCreateBasket = vi.fn().mockResolvedValue({ ident: 'tebex-123' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ createMinecraftBasket: mockCreateBasket });

      const props = {
        username: '',
        completeUrl: 'https://example.com/complete',
        cancelUrl: 'https://example.com/cancel',
        custom: { test: true },
        completeAutoRedirect: true,
        ipAddress: '1.2.3.4',
      };

      const result = await basketService.createBasket(props);

      expect(getTebex).toHaveBeenCalledTimes(1);
      expect(mockCreateBasket).toHaveBeenCalledWith(
        '',
        'https://example.com/complete',
        'https://example.com/cancel',
        { test: true },
        true,
        '1.2.3.4',
      );
      expect(result).toEqual({ ident: 'tebex-123' });
    });

    it('should throw if tebex.createBasket throws', async () => {
      const mockCreateBasket = vi.fn().mockRejectedValue(new Error('createBasket failed'));
      (getTebex as unknown as Mock).mockResolvedValue({ createMinecraftBasket: mockCreateBasket });

      await expect(() =>
        basketService.createBasket({
          username: '',
          completeUrl: 'https://example.com/complete',
          cancelUrl: 'https://example.com/cancel',
          custom: {},
          completeAutoRedirect: false,
          ipAddress: '',
        }),
      ).rejects.toThrow(new Error('createBasket failed'));
    });

    it('should throw if getTebex fails', async () => {
      (getTebex as unknown as Mock).mockRejectedValue(new Error('getTebex failed'));

      await expect(() =>
        basketService.createBasket({
          username: '',
          completeUrl: 'https://example.com/complete',
          cancelUrl: 'https://example.com/cancel',
          custom: {},
          completeAutoRedirect: false,
          ipAddress: '',
        }),
      ).rejects.toThrow('getTebex failed');
    });

    it('should pass undefined values to createBasket', async () => {
      const mockCreateBasket = vi.fn().mockResolvedValue({ ident: 'empty' });
      (getTebex as unknown as Mock).mockResolvedValue({ createMinecraftBasket: mockCreateBasket });

      await basketService.createBasket({
        username: '',
        completeUrl: '',
        cancelUrl: '',
        custom: undefined,
        completeAutoRedirect: undefined,
        ipAddress: undefined,
      });

      expect(mockCreateBasket).toHaveBeenCalledWith('', '', '', undefined, undefined, undefined);
    });

    it('should call getTebex before invoking createBasket', async () => {
      const callOrder: string[] = [];

      const mockCreateBasket = vi.fn().mockImplementation(() => {
        callOrder.push('createBasket');
        return Promise.resolve({ ident: 'order' });
      });

      (getTebex as unknown as Mock).mockImplementation(() => {
        callOrder.push('getTebex');
        return Promise.resolve({ createMinecraftBasket: mockCreateBasket });
      });

      await basketService.createBasket({
        username: '',
        completeUrl: 'https://complete',
        cancelUrl: 'https://cancel',
        custom: {},
        completeAutoRedirect: false,
        ipAddress: '',
      });

      expect(callOrder).toEqual(['getTebex', 'createBasket']);
    });

    it('should work if custom is omitted', async () => {
      const mockCreateBasket = vi.fn().mockResolvedValue({ ident: 'no-custom' });
      (getTebex as unknown as Mock).mockResolvedValue({ createMinecraftBasket: mockCreateBasket });

      const props = {
        username: '',
        completeUrl: 'https://example.com/complete',
        cancelUrl: 'https://example.com/cancel',
        completeAutoRedirect: true,
        ipAddress: '1.2.3.4',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await basketService.createBasket(props as any);

      expect(result).toEqual({ ident: 'no-custom' });
      expect(mockCreateBasket).toHaveBeenCalledWith(
        '',
        'https://example.com/complete',
        'https://example.com/cancel',
        undefined,
        true,
        '1.2.3.4',
      );
    });
  });

  describe('getBasket', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call tebex.getBasket with correct arguments and return basket', async () => {
      const mockGetBasket = vi
        .fn()
        .mockResolvedValue({ ident: 'basket-123', complete: false } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ getBasket: mockGetBasket });

      const result = await basketService.getBasket('basket-123');

      expect(getTebex).toHaveBeenCalledTimes(1);
      expect(mockGetBasket).toHaveBeenCalledWith('basket-123');
      expect(mockGetBasket).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ident: 'basket-123', complete: false });
    });

    it('should throw if tebex.getBasket throws', async () => {
      const mockGetBasket = vi.fn().mockRejectedValue(new Error('getBasket failed'));
      (getTebex as unknown as Mock).mockResolvedValue({ getBasket: mockGetBasket });

      await expect(() => basketService.getBasket('basket-error')).rejects.toThrow(
        new Error('getBasket failed'),
      );
    });

    it('should throw if getTebex fails', async () => {
      (getTebex as unknown as Mock).mockRejectedValue(new Error('getTebex failed'));

      await expect(() => basketService.getBasket('basket-123')).rejects.toThrow('getTebex failed');
    });

    it('should call getTebex before invoking getBasket', async () => {
      const callOrder: string[] = [];

      const mockGetBasket = vi.fn().mockImplementation(() => {
        callOrder.push('getBasket');
        return Promise.resolve({ ident: 'order' } as Basket);
      });

      (getTebex as unknown as Mock).mockImplementation(() => {
        callOrder.push('getTebex');
        return Promise.resolve({ getBasket: mockGetBasket });
      });

      await basketService.getBasket('basket-order');

      expect(callOrder).toEqual(['getTebex', 'getBasket']);
    });

    it('should handle different basket identifiers', async () => {
      const mockGetBasket = vi.fn().mockResolvedValue({ ident: 'different-basket' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ getBasket: mockGetBasket });

      await basketService.getBasket('different-basket');

      expect(mockGetBasket).toHaveBeenCalledWith('different-basket');
    });
  });

  describe('addPackageToBasket', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call tebex.addPackageToBasket with correct arguments and return basket', async () => {
      const mockAddPackage = vi
        .fn()
        .mockResolvedValue({ ident: 'basket-1', packages: [] } as unknown as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ addPackageToBasket: mockAddPackage });

      const result = await basketService.addPackageToBasket('basket-1', 42, 2, 'single', {
        var1: 'value1',
      });

      expect(getTebex).toHaveBeenCalledTimes(1);
      expect(mockAddPackage).toHaveBeenCalledWith('basket-1', 42, 2, 'single', { var1: 'value1' });
      expect(result).toEqual({ ident: 'basket-1', packages: [] });
    });

    it('should use default quantity of 1 when quantity is not provided', async () => {
      const mockAddPackage = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ addPackageToBasket: mockAddPackage });

      await basketService.addPackageToBasket('basket-1', 42);

      expect(mockAddPackage).toHaveBeenCalledWith('basket-1', 42, 1, undefined, undefined);
    });

    it('should use default quantity of 1 when quantity is undefined', async () => {
      const mockAddPackage = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ addPackageToBasket: mockAddPackage });

      await basketService.addPackageToBasket('basket-1', 42, undefined);

      expect(mockAddPackage).toHaveBeenCalledWith('basket-1', 42, 1, undefined, undefined);
    });

    it('should pass undefined for type and variableData when not provided', async () => {
      const mockAddPackage = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ addPackageToBasket: mockAddPackage });

      await basketService.addPackageToBasket('basket-1', 42, 3);

      expect(mockAddPackage).toHaveBeenCalledWith('basket-1', 42, 3, undefined, undefined);
    });

    it('should pass type when provided without variableData', async () => {
      const mockAddPackage = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ addPackageToBasket: mockAddPackage });

      await basketService.addPackageToBasket('basket-1', 42, 2, 'single');

      expect(mockAddPackage).toHaveBeenCalledWith('basket-1', 42, 2, 'single', undefined);
    });

    it('should pass variableData when provided without type', async () => {
      const mockAddPackage = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ addPackageToBasket: mockAddPackage });

      await basketService.addPackageToBasket('basket-1', 42, 2, undefined, { var1: 'value1' });

      expect(mockAddPackage).toHaveBeenCalledWith('basket-1', 42, 2, undefined, { var1: 'value1' });
    });

    it('should throw if tebex.addPackageToBasket throws', async () => {
      const mockAddPackage = vi.fn().mockRejectedValue(new Error('addPackage failed'));
      (getTebex as unknown as Mock).mockResolvedValue({ addPackageToBasket: mockAddPackage });

      await expect(() => basketService.addPackageToBasket('basket-1', 42)).rejects.toThrow(
        new Error('addPackage failed'),
      );
    });

    it('should throw if getTebex fails', async () => {
      (getTebex as unknown as Mock).mockRejectedValue(new Error('getTebex failed'));

      await expect(() => basketService.addPackageToBasket('basket-1', 42)).rejects.toThrow(
        'getTebex failed',
      );
    });

    it('should call getTebex before invoking addPackageToBasket', async () => {
      const callOrder: string[] = [];

      const mockAddPackage = vi.fn().mockImplementation(() => {
        callOrder.push('addPackageToBasket');
        return Promise.resolve({ ident: 'order' } as Basket);
      });

      (getTebex as unknown as Mock).mockImplementation(() => {
        callOrder.push('getTebex');
        return Promise.resolve({ addPackageToBasket: mockAddPackage });
      });

      await basketService.addPackageToBasket('basket-order', 42);

      expect(callOrder).toEqual(['getTebex', 'addPackageToBasket']);
    });

    it('should handle empty variableData object', async () => {
      const mockAddPackage = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ addPackageToBasket: mockAddPackage });

      await basketService.addPackageToBasket('basket-1', 42, 1, 'single', {});

      expect(mockAddPackage).toHaveBeenCalledWith('basket-1', 42, 1, 'single', {});
    });
  });

  describe('removePackageFromBasket', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call tebex.updateQuantity with correct arguments and return basket', async () => {
      const mockUpdateQuantity = vi
        .fn()
        .mockResolvedValue({ ident: 'basket-1', packages: [] } as unknown as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ updateQuantity: mockUpdateQuantity });

      const result = await basketService.removePackageFromBasket('basket-1', 42, 3);

      expect(getTebex).toHaveBeenCalledTimes(1);
      expect(mockUpdateQuantity).toHaveBeenCalledWith('basket-1', 42, 2);
      expect(result).toEqual({ ident: 'basket-1', packages: [] });
    });

    it('should decrease quantity by 1', async () => {
      const mockUpdateQuantity = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ updateQuantity: mockUpdateQuantity });

      await basketService.removePackageFromBasket('basket-1', 42, 5);

      expect(mockUpdateQuantity).toHaveBeenCalledWith('basket-1', 42, 4);
    });

    it('should not allow quantity to go below 0 when currentQuantity is 1', async () => {
      const mockUpdateQuantity = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ updateQuantity: mockUpdateQuantity });

      await basketService.removePackageFromBasket('basket-1', 42, 1);

      expect(mockUpdateQuantity).toHaveBeenCalledWith('basket-1', 42, 0);
    });

    it('should not allow quantity to go below 0 when currentQuantity is 0', async () => {
      const mockUpdateQuantity = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ updateQuantity: mockUpdateQuantity });

      await basketService.removePackageFromBasket('basket-1', 42, 0);

      expect(mockUpdateQuantity).toHaveBeenCalledWith('basket-1', 42, 0);
    });

    it('should handle negative currentQuantity by using 0', async () => {
      const mockUpdateQuantity = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ updateQuantity: mockUpdateQuantity });

      await basketService.removePackageFromBasket('basket-1', 42, -5);

      expect(mockUpdateQuantity).toHaveBeenCalledWith('basket-1', 42, 0);
    });

    it('should throw if tebex.updateQuantity throws', async () => {
      const mockUpdateQuantity = vi.fn().mockRejectedValue(new Error('updateQuantity failed'));
      (getTebex as unknown as Mock).mockResolvedValue({ updateQuantity: mockUpdateQuantity });

      await expect(() => basketService.removePackageFromBasket('basket-1', 42, 2)).rejects.toThrow(
        new Error('updateQuantity failed'),
      );
    });

    it('should throw if getTebex fails', async () => {
      (getTebex as unknown as Mock).mockRejectedValue(new Error('getTebex failed'));

      await expect(() => basketService.removePackageFromBasket('basket-1', 42, 2)).rejects.toThrow(
        'getTebex failed',
      );
    });

    it('should call getTebex before invoking updateQuantity', async () => {
      const callOrder: string[] = [];

      const mockUpdateQuantity = vi.fn().mockImplementation(() => {
        callOrder.push('updateQuantity');
        return Promise.resolve({ ident: 'order' } as Basket);
      });

      (getTebex as unknown as Mock).mockImplementation(() => {
        callOrder.push('getTebex');
        return Promise.resolve({ updateQuantity: mockUpdateQuantity });
      });

      await basketService.removePackageFromBasket('basket-order', 42, 2);

      expect(callOrder).toEqual(['getTebex', 'updateQuantity']);
    });

    it('should handle large quantities', async () => {
      const mockUpdateQuantity = vi.fn().mockResolvedValue({ ident: 'basket-1' } as Basket);
      (getTebex as unknown as Mock).mockResolvedValue({ updateQuantity: mockUpdateQuantity });

      await basketService.removePackageFromBasket('basket-1', 42, 1000);

      expect(mockUpdateQuantity).toHaveBeenCalledWith('basket-1', 42, 999);
    });
  });
});
