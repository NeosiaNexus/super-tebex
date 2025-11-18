import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Category } from 'tebex_headless';
import categoriesService from '../services/categoriesService';
import type { GetCategories } from '../types';

interface UseCategoriesResult {
  categories: Category[] | null;
  loading: boolean;
  error: Error | null;
  getByName: (name: string) => Category | undefined;
  refetch: () => Promise<void>;
}

const useCategories = (options: GetCategories): UseCategoriesResult => {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedOptions = useMemo(
    () => options,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.includePackages, options.basketIdent, options.ipAddress],
  );

  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriesService.getCategories(memoizedOptions);
      setCategories(data);
    } catch (err) {
      setError(err as Error);
      setCategories(null);
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const getByName = useCallback(
    (name: string) => categories?.find(cat => cat.name.toLowerCase() === name.toLowerCase()),
    [categories],
  );

  return {
    categories,
    loading,
    error,
    getByName,
    refetch: fetchCategories,
  };
};

export default useCategories;
