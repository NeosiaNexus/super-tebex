/**
 * Query keys factory for TanStack Query.
 * Follows the recommended pattern for granular cache invalidation.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */
export const tebexKeys = {
  /** Root key for all Tebex queries */
  all: ['tebex'] as const,

  // ============ Categories ============

  /** All category-related queries */
  categories: () => [...tebexKeys.all, 'categories'] as const,

  /** Categories list with include packages option */
  categoriesList: (includePackages: boolean) =>
    [...tebexKeys.categories(), 'list', { includePackages }] as const,

  /** Single category by ID */
  category: (id: number) => [...tebexKeys.categories(), 'detail', id] as const,

  // ============ Packages ============

  /** All package-related queries */
  packages: () => [...tebexKeys.all, 'packages'] as const,

  /** Packages list, optionally filtered by category */
  packagesList: (categoryId?: number) => [...tebexKeys.packages(), 'list', { categoryId }] as const,

  /** Single package by ID */
  package: (id: number) => [...tebexKeys.packages(), 'detail', id] as const,

  // ============ Basket ============

  /** All basket-related queries */
  baskets: () => [...tebexKeys.all, 'baskets'] as const,

  /** Specific basket by ident */
  basket: (ident: string | null) => [...tebexKeys.baskets(), ident] as const,

  // ============ Webstore ============

  /** Webstore info query */
  webstore: () => [...tebexKeys.all, 'webstore'] as const,
} as const;

/**
 * Type helper for extracting query key types.
 */
type KeyFunctions = Omit<typeof tebexKeys, 'all'>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
export type TebexQueryKey =
  | (typeof tebexKeys)['all']
  | ExtractReturnType<KeyFunctions[keyof KeyFunctions]>;
