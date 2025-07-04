import { Category } from 'tebex_headless';
import { getTebex } from '../client';
import { GetCategories } from '../types';

const getCategories = async ({
  includePackages,
  basketIdent,
  ipAddress,
}: GetCategories): Promise<Category[]> => {
  const tebex = await getTebex();

  return tebex.getCategories(includePackages, basketIdent, ipAddress);
};

const categoriesService = {
  getCategories,
};

export default categoriesService;
