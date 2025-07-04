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
});
