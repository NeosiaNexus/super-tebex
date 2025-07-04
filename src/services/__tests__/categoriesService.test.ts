import type { Category } from 'tebex_headless';
import { Mock, vi } from 'vitest';

import { getTebex } from '../../client';
import categoriesService from '../categoriesService';

vi.mock('../../client', () => ({
  getTebex: vi.fn(),
}));

describe('categoriesService', () => {
  describe('getCategories', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call tebex.getCategories with correct arguments and return result', async () => {
      const mockGetCategories = vi.fn().mockResolvedValue([{ id: 1, name: 'cat' }] as Category[]);
      (getTebex as unknown as Mock).mockResolvedValue({ getCategories: mockGetCategories });

      const result = await categoriesService.getCategories({
        includePackages: true,
        basketIdent: 'basket-123',
        ipAddress: '1.2.3.4',
      });

      expect(getTebex).toHaveBeenCalledTimes(1);
      expect(mockGetCategories).toHaveBeenCalledWith(true, 'basket-123', '1.2.3.4');
      expect(result).toEqual([{ id: 1, name: 'cat' }]);
    });

    it('should handle undefined arguments', async () => {
      const mockGetCategories = vi.fn().mockResolvedValue([{ id: 2 }] as Category[]);
      (getTebex as unknown as Mock).mockResolvedValue({ getCategories: mockGetCategories });

      await categoriesService.getCategories({
        includePackages: undefined,
        basketIdent: undefined,
        ipAddress: undefined,
      });

      expect(mockGetCategories).toHaveBeenCalledWith(undefined, undefined, undefined);
    });

    it('should throw if getTebex fails', async () => {
      (getTebex as unknown as Mock).mockRejectedValue(new Error('getTebex error'));

      await expect(() =>
        categoriesService.getCategories({
          includePackages: true,
          basketIdent: 'id',
          ipAddress: 'ip',
        }),
      ).rejects.toThrow('getTebex error');
    });

    it('should throw if tebex.getCategories throws', async () => {
      const mockGetCategories = vi.fn().mockRejectedValue(new Error('tebex.getCategories failed'));
      (getTebex as unknown as Mock).mockResolvedValue({ getCategories: mockGetCategories });

      await expect(() =>
        categoriesService.getCategories({
          includePackages: false,
          basketIdent: 'id',
          ipAddress: 'ip',
        }),
      ).rejects.toThrow('tebex.getCategories failed');
    });

    it('should call getTebex before getCategories', async () => {
      const order: string[] = [];

      const mockGetCategories = vi.fn().mockImplementation(() => {
        order.push('getCategories');
        return Promise.resolve([]);
      });

      (getTebex as unknown as Mock).mockImplementation(() => {
        order.push('getTebex');
        return Promise.resolve({ getCategories: mockGetCategories });
      });

      await categoriesService.getCategories({
        includePackages: false,
        basketIdent: 'id',
        ipAddress: 'ip',
      });

      expect(order).toEqual(['getTebex', 'getCategories']);
    });
  });
});
