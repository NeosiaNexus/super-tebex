# Plan de refonte v3.0 - @neosia/tebex-nextjs

> Document de planification pour la transformation de `@neosianexus/super-tebex` en `@neosia/tebex-nextjs`

## Vue d'ensemble

| Attribut | Valeur |
|----------|--------|
| Version cible | 3.0.0 |
| Type | Breaking change |
| Scope | Next.js App Router uniquement |
| Licence | MIT |

> **⚠️ IMPORTANT: Ce plan est un document vivant**
>
> Ce plan de refonte n'est **pas figé**. Il peut être modifié à tout moment au cours du développement si :
> - Une meilleure approche technique est identifiée
> - Des contraintes imprévues apparaissent
> - L'API de `tebex_headless` ou de TanStack Query évolue
> - Les retours d'utilisation suggèrent des améliorations
> - Des optimisations de performance sont découvertes
>
> L'objectif est de livrer la meilleure solution possible, pas de suivre aveuglément un plan initial.

## Objectifs

1. **Performance** - TanStack Query pour cache, retry, stale-while-revalidate
2. **DX** - Provider pattern, hooks granulaires, TypeScript strict
3. **TypeScript First** - Zero `any`, types exhaustifs, inference maximale
4. **Maintenabilite** - Error codes, tests MSW, coverage 90%+
5. **Securite** - Trusted publishing, provenance, 2FA
6. **Extensibilite** - Architecture modulaire pour ajouts futurs

---

## Architecture cible

```
@neosia/tebex-nextjs/
├── src/
│   ├── provider/
│   │   └── TebexProvider.tsx       # Provider React avec QueryClient
│   │
│   ├── hooks/
│   │   ├── useBasket.ts            # Gestion panier (refacto)
│   │   ├── useCategories.ts        # Liste categories (refacto)
│   │   ├── useCategory.ts          # NEW: Une categorie
│   │   ├── usePackages.ts          # NEW: Liste packages
│   │   ├── usePackage.ts           # NEW: Un package
│   │   ├── useCheckout.ts          # NEW: Lance Tebex.js modal
│   │   ├── useCoupons.ts           # NEW: Gestion coupons
│   │   ├── useGiftCards.ts         # NEW: Cartes cadeaux
│   │   ├── useCreatorCodes.ts      # NEW: Codes createur
│   │   ├── useWebstore.ts          # NEW: Infos boutique
│   │   └── useGiftPackage.ts       # NEW: Offrir un package
│   │
│   ├── queries/
│   │   ├── keys.ts                 # Query keys factory
│   │   ├── categories.ts           # useQuery pour categories
│   │   ├── packages.ts             # useQuery pour packages
│   │   ├── basket.ts               # useQuery + useMutation basket
│   │   └── webstore.ts             # useQuery webstore
│   │
│   ├── services/
│   │   ├── api.ts                  # Wrapper tebex_headless
│   │   └── checkout.ts             # Integration Tebex.js
│   │
│   ├── stores/
│   │   ├── basketStore.ts          # Zustand: basket ident (persisted)
│   │   └── userStore.ts            # Zustand: username (persisted)
│   │
│   ├── errors/
│   │   ├── codes.ts                # Enum TebexErrorCode
│   │   ├── TebexError.ts           # Classe d'erreur custom
│   │   └── boundaries.ts           # ErrorBoundary optionnel
│   │
│   ├── types/
│   │   ├── index.ts                # Re-exports (tous types publics)
│   │   ├── config.ts               # TebexConfig, TebexUrls
│   │   ├── result.ts               # Result<T, E> discriminated union
│   │   ├── hooks.ts                # Types retour des hooks (exportes)
│   │   └── guards.ts               # Type guards (isTebexError, isSuccess, etc.)
│   │
│   └── index.ts                    # Barrel exports
│
├── __tests__/
│   ├── mocks/
│   │   └── handlers.ts             # MSW handlers
│   ├── hooks/                      # Tests hooks
│   ├── provider/                   # Tests provider
│   └── setup.ts                    # Vitest + MSW setup
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Tests + lint + coverage
│       └── release.yml             # Trusted publishing sur tag
│
└── package.json
```

---

## Strategie TypeScript

### Principes fondamentaux

| Regle | Description |
|-------|-------------|
| **Zero `any`** | Aucun `any` explicite ou implicite dans le code |
| **Strict mode** | `strict: true` dans tsconfig.json |
| **No implicit** | `noImplicitAny`, `noImplicitThis`, `noImplicitReturns` |
| **Exhaustive** | `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply` |
| **Unknown over any** | Utiliser `unknown` + type guards au lieu de `any` |

### Configuration tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Types exportes

Tous les types doivent etre exportes pour permettre aux consommateurs de les utiliser:

**Fichier:** `src/types/index.ts`

```typescript
// Config
export type { TebexConfig, TebexUrls } from './config';

// Results
export type { Result } from './result';
export { ok, err } from './result';

// Errors
export { TebexError } from '../errors/TebexError';
export { TebexErrorCode } from '../errors/codes';

// Hook returns - permet aux consommateurs de typer leurs props
export type { UseCategoriesReturn } from './hooks';
export type { UseBasketReturn } from './hooks';
export type { UseCheckoutReturn } from './hooks';
export type { UseCouponsReturn } from './hooks';
export type { UseGiftCardsReturn } from './hooks';
export type { UseCreatorCodesReturn } from './hooks';
export type { UseWebstoreReturn } from './hooks';
export type { UsePackagesReturn } from './hooks';
export type { UsePackageReturn } from './hooks';
export type { UseCategoryReturn } from './hooks';
export type { UseUserReturn } from './hooks';
export type { UseGiftPackageReturn } from './hooks';

// Tebex API types re-exports
export type {
  Category,
  Package,
  Basket,
  BasketPackage,
  Coupon,
  GiftCard,
  Webstore,
  PackageType,
} from 'tebex_headless';
```

### Types des hooks

**Fichier:** `src/types/hooks.ts`

```typescript
import type { TebexError } from '../errors/TebexError';
import type { TebexErrorCode } from '../errors/codes';
import type { Category, Package, Basket, Coupon, GiftCard, Webstore } from 'tebex_headless';

// Base return type pour tous les hooks query
interface BaseQueryReturn<T> {
  data: T | null;
  isLoading: boolean;
  isFetching: boolean;
  error: TebexError | null;
  errorCode: TebexErrorCode | null;
  refetch: () => Promise<unknown>;
}

// Base return type pour les mutations
interface BaseMutationReturn {
  isPending: boolean;
  error: TebexError | null;
  errorCode: TebexErrorCode | null;
}

export interface UseCategoriesReturn extends BaseQueryReturn<Category[]> {
  categories: Category[] | null;
  getByName: (name: string) => Category | undefined;
  getById: (id: number) => Category | undefined;
}

export interface UseCategoryReturn extends BaseQueryReturn<Category> {
  category: Category | null;
}

export interface UsePackagesReturn extends BaseQueryReturn<Package[]> {
  packages: Package[] | null;
  getById: (id: number) => Package | undefined;
  getByName: (name: string) => Package | undefined;
}

export interface UsePackageReturn extends BaseQueryReturn<Package> {
  package: Package | null;
}

export interface UseBasketReturn extends BaseQueryReturn<Basket> {
  basket: Basket | null;
  basketIdent: string | null;

  // Mutation states
  isAddingPackage: boolean;
  isRemovingPackage: boolean;
  isUpdatingQuantity: boolean;

  // Actions
  addPackage: (params: AddPackageParams) => Promise<void>;
  removePackage: (packageId: number) => Promise<void>;
  updateQuantity: (params: UpdateQuantityParams) => Promise<void>;
  clearBasket: () => void;

  // Computed
  itemCount: number;
  total: number;
}

export interface AddPackageParams {
  packageId: number;
  quantity?: number;
  type?: PackageType;
  variableData?: Record<string, string>;
}

export interface UpdateQuantityParams {
  packageId: number;
  quantity: number;
}

export interface UseCheckoutReturn {
  launch: () => Promise<void>;
  isLaunching: boolean;
  error: TebexError | null;
  errorCode: TebexErrorCode | null;
  canCheckout: boolean;
  checkoutUrl: string | null;
}

export interface UseCouponsReturn {
  coupons: Coupon[];
  apply: (couponCode: string) => Promise<void>;
  remove: (couponCode: string) => Promise<void>;
  isApplying: boolean;
  isRemoving: boolean;
  error: TebexError | null;
  errorCode: TebexErrorCode | null;
}

export interface UseGiftCardsReturn {
  giftCards: GiftCard[];
  apply: (cardNumber: string) => Promise<void>;
  remove: (cardNumber: string) => Promise<void>;
  isApplying: boolean;
  isRemoving: boolean;
  error: TebexError | null;
  errorCode: TebexErrorCode | null;
}

export interface UseCreatorCodesReturn {
  creatorCode: string | null;
  apply: (code: string) => Promise<void>;
  remove: () => Promise<void>;
  isApplying: boolean;
  isRemoving: boolean;
  error: TebexError | null;
  errorCode: TebexErrorCode | null;
}

export interface UseWebstoreReturn extends BaseQueryReturn<Webstore> {
  webstore: Webstore | null;
  name: string | null;
  currency: string | null;
  domain: string | null;
}

export interface UseUserReturn {
  username: string | null;
  setUsername: (username: string) => void;
  clearUsername: () => void;
  isAuthenticated: boolean;
}

export interface UseGiftPackageReturn {
  gift: (params: GiftPackageParams) => Promise<void>;
  isGifting: boolean;
  error: TebexError | null;
  errorCode: TebexErrorCode | null;
}

export interface GiftPackageParams {
  packageId: number;
  targetUsername: string;
  quantity?: number;
}
```

### Type Guards

**Fichier:** `src/types/guards.ts`

```typescript
import { TebexError } from '../errors/TebexError';
import type { Result } from './result';

// Type guard pour TebexError
export function isTebexError(error: unknown): error is TebexError {
  return error instanceof TebexError;
}

// Type guard pour Result success
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

// Type guard pour Result error
export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

// Type guard pour verifier si une valeur est definie
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
```

### Generics pour les hooks

```typescript
// Hook factory generique avec types stricts
type UseQueryHook<TData, TParams = void> = TParams extends void
  ? () => BaseQueryReturn<TData> & { data: TData | null }
  : (params: TParams) => BaseQueryReturn<TData> & { data: TData | null };

// Exemple d'utilisation dans les tests
type CategoryHook = UseQueryHook<Category[], { includePackages?: boolean }>;
type PackageHook = UseQueryHook<Package, { id: number }>;
```

### Regles ESLint TypeScript

**Fichier:** `eslint.config.js` (extrait)

```javascript
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
    },
  },
];
```

### Avantages pour les consommateurs

1. **Autocompletion parfaite** - Les types exportes permettent une DX optimale dans les IDE
2. **Erreurs a la compilation** - Pas de surprises au runtime
3. **Refactoring safe** - Renommer une prop casse le build si mal utilise
4. **Documentation implicite** - Les types servent de documentation
5. **Integration facile** - Typer les props des composants avec les types exportes:

```typescript
// Exemple d'utilisation par le consommateur
import type { UseBasketReturn, Category } from '@neosia/tebex-nextjs';

interface CartProps {
  basket: UseBasketReturn['basket'];
  onCheckout: () => void;
}

interface CategoryListProps {
  categories: Category[];
  onSelect: (category: Category) => void;
}
```

---

## Phase 1: Core Architecture

### 1.1 Provider Pattern

**Fichier:** `src/provider/TebexProvider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createContext, useContext, useState, type ReactNode } from 'react';

export interface TebexConfig {
  publicKey: string;
  baseUrl: string;
  urls?: {
    complete?: string;  // default: /shop/complete
    cancel?: string;    // default: /shop/cancel
  };
  onError?: (error: TebexError) => void;
  devtools?: boolean;   // default: process.env.NODE_ENV === 'development'
}

interface TebexContextValue {
  config: TebexConfig;
  queryClient: QueryClient;
}

const TebexContext = createContext<TebexContextValue | null>(null);

export function TebexProvider({
  children,
  config
}: {
  children: ReactNode;
  config: TebexConfig;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,        // 1 minute
        gcTime: 5 * 60 * 1000,       // 5 minutes (anciennement cacheTime)
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <TebexContext.Provider value={{ config, queryClient }}>
      <QueryClientProvider client={queryClient}>
        {children}
        {config.devtools !== false && process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </TebexContext.Provider>
  );
}

export function useTebexContext() {
  const context = useContext(TebexContext);
  if (!context) {
    throw new TebexError(
      TebexErrorCode.PROVIDER_NOT_FOUND,
      'useTebexContext must be used within TebexProvider'
    );
  }
  return context;
}
```

**Justification:**
- Un seul Provider pour tout configurer
- QueryClient encapsule avec config optimisee
- DevTools automatiques en dev
- Callback `onError` pour gestion centralisee

---

### 1.2 Systeme d'erreurs

**Fichier:** `src/errors/codes.ts`

```typescript
export enum TebexErrorCode {
  // Provider errors (1xx)
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // Authentication errors (2xx)
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  INVALID_USERNAME = 'INVALID_USERNAME',

  // Basket errors (3xx)
  BASKET_NOT_FOUND = 'BASKET_NOT_FOUND',
  BASKET_CREATION_FAILED = 'BASKET_CREATION_FAILED',
  BASKET_EXPIRED = 'BASKET_EXPIRED',

  // Package errors (4xx)
  PACKAGE_NOT_FOUND = 'PACKAGE_NOT_FOUND',
  PACKAGE_OUT_OF_STOCK = 'PACKAGE_OUT_OF_STOCK',
  PACKAGE_ALREADY_OWNED = 'PACKAGE_ALREADY_OWNED',
  INVALID_QUANTITY = 'INVALID_QUANTITY',

  // Category errors (5xx)
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',

  // Coupon/GiftCard errors (6xx)
  COUPON_INVALID = 'COUPON_INVALID',
  COUPON_EXPIRED = 'COUPON_EXPIRED',
  COUPON_ALREADY_USED = 'COUPON_ALREADY_USED',
  GIFTCARD_INVALID = 'GIFTCARD_INVALID',
  GIFTCARD_INSUFFICIENT_BALANCE = 'GIFTCARD_INSUFFICIENT_BALANCE',
  CREATOR_CODE_INVALID = 'CREATOR_CODE_INVALID',

  // Checkout errors (7xx)
  CHECKOUT_FAILED = 'CHECKOUT_FAILED',
  CHECKOUT_CANCELLED = 'CHECKOUT_CANCELLED',

  // Network errors (8xx)
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}
```

**Fichier:** `src/errors/TebexError.ts`

```typescript
export class TebexError extends Error {
  constructor(
    public readonly code: TebexErrorCode,
    message?: string,
    public readonly cause?: unknown
  ) {
    super(message ?? code);
    this.name = 'TebexError';
  }

  static fromUnknown(error: unknown): TebexError {
    if (error instanceof TebexError) return error;
    if (error instanceof Error) {
      return new TebexError(TebexErrorCode.UNKNOWN, error.message, error);
    }
    return new TebexError(TebexErrorCode.UNKNOWN, String(error));
  }
}
```

**Fichier:** `src/types/result.ts`

```typescript
// Discriminated union pour resultat type-safe
export type Result<T, E = TebexError> =
  | { success: true; data: T }
  | { success: false; error: E };

// Helper functions
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
```

**Justification:**
- Codes d'erreur enumeres (pas de messages hardcodes)
- Classe `TebexError` avec code, message, cause
- Type `Result<T, E>` pour retours type-safe
- Le consommateur traduit les codes dans sa langue

---

### 1.3 Query Keys Factory

**Fichier:** `src/queries/keys.ts`

```typescript
export const tebexKeys = {
  all: ['tebex'] as const,

  // Categories
  categories: () => [...tebexKeys.all, 'categories'] as const,
  categoriesList: (includePackages: boolean) =>
    [...tebexKeys.categories(), 'list', { includePackages }] as const,
  category: (id: number) => [...tebexKeys.categories(), 'detail', id] as const,

  // Packages
  packages: () => [...tebexKeys.all, 'packages'] as const,
  packagesList: () => [...tebexKeys.packages(), 'list'] as const,
  package: (id: number) => [...tebexKeys.packages(), 'detail', id] as const,

  // Basket
  baskets: () => [...tebexKeys.all, 'baskets'] as const,
  basket: (ident: string | null) => [...tebexKeys.baskets(), ident] as const,

  // Webstore
  webstore: () => [...tebexKeys.all, 'webstore'] as const,
} as const;
```

**Justification:**
- Pattern recommande par TanStack Query
- Invalidation granulaire (ex: `queryClient.invalidateQueries({ queryKey: tebexKeys.basket(ident) })`)
- Type inference automatique

---

## Phase 2: Hooks Implementation

### 2.1 useCategories (refacto)

**Fichier:** `src/hooks/useCategories.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useTebexContext } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';
import { getTebex } from '../services/api';

export interface UseCategoriesOptions {
  includePackages?: boolean;
  enabled?: boolean;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { includePackages = true, enabled = true } = options;
  const { config } = useTebexContext();

  const query = useQuery({
    queryKey: tebexKeys.categoriesList(includePackages),
    queryFn: async () => {
      const tebex = getTebex();
      return tebex.getCategories(includePackages);
    },
    enabled,
  });

  const getByName = (name: string) =>
    query.data?.find(c => c.name.toLowerCase() === name.toLowerCase());

  const getById = (id: number) =>
    query.data?.find(c => c.id === id);

  return {
    categories: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? TebexError.fromUnknown(query.error) : null,
    errorCode: query.error ? TebexError.fromUnknown(query.error).code : null,
    refetch: query.refetch,
    getByName,
    getById,
  };
}
```

### 2.2 useBasket (refacto avec mutations)

**Fichier:** `src/hooks/useBasket.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useShopBasketStore } from '../stores/basketStore';
import { useShopUserStore } from '../stores/userStore';
import { useTebexContext } from '../provider/TebexProvider';
import { tebexKeys } from '../queries/keys';

export function useBasket() {
  const { config } = useTebexContext();
  const queryClient = useQueryClient();

  const basketIdent = useShopBasketStore(s => s.basketIdent);
  const setBasketIdent = useShopBasketStore(s => s.setBasketIdent);
  const clearBasketIdent = useShopBasketStore(s => s.clearBasketIdent);
  const username = useShopUserStore(s => s.username);

  // Query: Get basket
  const basketQuery = useQuery({
    queryKey: tebexKeys.basket(basketIdent),
    queryFn: async () => {
      if (!basketIdent) return null;
      const tebex = getTebex();
      return tebex.getBasket(basketIdent);
    },
    enabled: !!basketIdent,
  });

  // Mutation: Add package
  const addMutation = useMutation({
    mutationFn: async (params: {
      packageId: number;
      quantity?: number;
      type?: PackageType;
      variableData?: Record<string, string>;
    }) => {
      let ident = basketIdent;

      // Create basket if needed
      if (!ident) {
        if (!username) {
          throw new TebexError(TebexErrorCode.NOT_AUTHENTICATED);
        }
        const tebex = getTebex();
        const basket = await tebex.createMinecraftBasket(
          username,
          `${config.baseUrl}${config.urls?.complete ?? '/shop/complete'}`,
          `${config.baseUrl}${config.urls?.cancel ?? '/shop/cancel'}`
        );
        ident = basket.ident;
        setBasketIdent(ident);
      }

      const tebex = getTebex();
      await tebex.addPackageToBasket(
        ident,
        params.packageId,
        params.quantity ?? 1,
        params.type,
        params.variableData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tebexKeys.basket(basketIdent) });
    },
    onError: (error) => {
      config.onError?.(TebexError.fromUnknown(error));
    },
  });

  // Mutation: Remove package
  const removeMutation = useMutation({
    mutationFn: async (packageId: number) => {
      if (!basketIdent) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebex();
      await tebex.removePackage(basketIdent, packageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tebexKeys.basket(basketIdent) });
    },
    onError: (error) => {
      config.onError?.(TebexError.fromUnknown(error));
    },
  });

  // Mutation: Update quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async (params: { packageId: number; quantity: number }) => {
      if (!basketIdent) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebex();
      await tebex.updateQuantity(basketIdent, params.packageId, params.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tebexKeys.basket(basketIdent) });
    },
  });

  return {
    // Data
    basket: basketQuery.data ?? null,
    basketIdent,

    // States
    isLoading: basketQuery.isLoading,
    isFetching: basketQuery.isFetching,
    isAddingPackage: addMutation.isPending,
    isRemovingPackage: removeMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,

    // Errors
    error: basketQuery.error ? TebexError.fromUnknown(basketQuery.error) : null,
    errorCode: basketQuery.error ? TebexError.fromUnknown(basketQuery.error).code : null,

    // Actions
    addPackage: addMutation.mutateAsync,
    removePackage: removeMutation.mutateAsync,
    updateQuantity: updateQuantityMutation.mutateAsync,
    clearBasket: clearBasketIdent,
    refetch: basketQuery.refetch,

    // Computed
    itemCount: basketQuery.data?.packages.reduce((acc, p) => acc + p.in_basket.quantity, 0) ?? 0,
    total: basketQuery.data?.total ?? 0,
  };
}
```

### 2.3 useCheckout (NEW)

**Fichier:** `src/hooks/useCheckout.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { useBasket } from './useBasket';
import { useTebexContext } from '../provider/TebexProvider';

declare global {
  interface Window {
    Tebex?: {
      checkout: {
        init: (options: { ident: string }) => void;
        launch: () => void;
        on: (event: string, callback: (data?: unknown) => void) => void;
        close: () => void;
      };
    };
  }
}

export interface UseCheckoutOptions {
  onSuccess?: () => void;
  onError?: (error: TebexError) => void;
  onClose?: () => void;
}

export function useCheckout(options: UseCheckoutOptions = {}) {
  const { basket, basketIdent, clearBasket } = useBasket();
  const { config } = useTebexContext();

  const launchMutation = useMutation({
    mutationFn: async () => {
      if (!basketIdent || !basket) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }

      if (!window.Tebex) {
        throw new TebexError(
          TebexErrorCode.CHECKOUT_FAILED,
          'Tebex.js not loaded. Add <script src="https://js.tebex.io/v/checkout.js"></script> to your page.'
        );
      }

      return new Promise<void>((resolve, reject) => {
        window.Tebex!.checkout.init({ ident: basketIdent });

        window.Tebex!.checkout.on('payment:complete', () => {
          clearBasket();
          options.onSuccess?.();
          resolve();
        });

        window.Tebex!.checkout.on('payment:error', (data) => {
          const error = new TebexError(TebexErrorCode.CHECKOUT_FAILED, String(data));
          options.onError?.(error);
          config.onError?.(error);
          reject(error);
        });

        window.Tebex!.checkout.on('close', () => {
          options.onClose?.();
        });

        window.Tebex!.checkout.launch();
      });
    },
  });

  return {
    launch: launchMutation.mutateAsync,
    isLaunching: launchMutation.isPending,
    error: launchMutation.error ? TebexError.fromUnknown(launchMutation.error) : null,
    errorCode: launchMutation.error ? TebexError.fromUnknown(launchMutation.error).code : null,

    // Computed
    canCheckout: !!basket && basket.packages.length > 0,
    checkoutUrl: basket?.links?.checkout ?? null,
  };
}
```

### 2.4 useCoupons (NEW)

**Fichier:** `src/hooks/useCoupons.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBasket } from './useBasket';
import { tebexKeys } from '../queries/keys';

export function useCoupons() {
  const { basket, basketIdent } = useBasket();
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: async (couponCode: string) => {
      if (!basketIdent) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebex();
      await tebex.apply(basketIdent, 'coupons', { coupon_code: couponCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tebexKeys.basket(basketIdent) });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (couponCode: string) => {
      if (!basketIdent) {
        throw new TebexError(TebexErrorCode.BASKET_NOT_FOUND);
      }
      const tebex = getTebex();
      await tebex.remove(basketIdent, 'coupons', { coupon_code: couponCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tebexKeys.basket(basketIdent) });
    },
  });

  return {
    coupons: basket?.coupons ?? [],
    apply: applyMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isApplying: applyMutation.isPending,
    isRemoving: removeMutation.isPending,
    error: applyMutation.error ?? removeMutation.error
      ? TebexError.fromUnknown(applyMutation.error ?? removeMutation.error)
      : null,
  };
}
```

### 2.5 Autres hooks (pattern similaire)

| Hook | Fichier | Description |
|------|---------|-------------|
| `useCategory(id)` | `src/hooks/useCategory.ts` | Recupere une categorie par ID |
| `usePackages()` | `src/hooks/usePackages.ts` | Liste tous les packages |
| `usePackage(id)` | `src/hooks/usePackage.ts` | Recupere un package par ID |
| `useGiftCards()` | `src/hooks/useGiftCards.ts` | Apply/remove gift cards |
| `useCreatorCodes()` | `src/hooks/useCreatorCodes.ts` | Apply/remove creator codes |
| `useWebstore()` | `src/hooks/useWebstore.ts` | Infos boutique (nom, devise, logo) |
| `useGiftPackage()` | `src/hooks/useGiftPackage.ts` | Offrir un package a un autre joueur |
| `useUser()` | `src/hooks/useUser.ts` | Gestion username (store) |

---

## Phase 3: Tests avec MSW

### 3.1 Setup MSW

**Fichier:** `__tests__/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';

const BASE_URL = 'https://headless.tebex.io/api';

export const handlers = [
  // GET /accounts
  http.get(`${BASE_URL}/accounts`, () => {
    return HttpResponse.json({
      data: {
        id: 1,
        name: 'Test Store',
        currency: 'EUR',
        domain: 'test.tebex.io',
      },
    });
  }),

  // GET /accounts/categories
  http.get(`${BASE_URL}/accounts/categories`, ({ request }) => {
    const url = new URL(request.url);
    const includePackages = url.searchParams.get('includePackages') === '1';

    return HttpResponse.json({
      data: [
        {
          id: 1,
          name: 'VIP',
          packages: includePackages ? [{ id: 101, name: 'VIP Gold', price: 9.99 }] : [],
        },
      ],
    });
  }),

  // POST /baskets
  http.post(`${BASE_URL}/baskets`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: {
        ident: 'test-basket-123',
        packages: [],
        total: 0,
        links: { checkout: 'https://checkout.tebex.io/test' },
      },
    });
  }),

  // GET /baskets/:ident
  http.get(`${BASE_URL}/baskets/:ident`, ({ params }) => {
    return HttpResponse.json({
      data: {
        ident: params.ident,
        packages: [],
        coupons: [],
        giftcards: [],
        total: 0,
      },
    });
  }),

  // POST /baskets/:ident/packages
  http.post(`${BASE_URL}/baskets/:ident/packages`, async () => {
    return HttpResponse.json({ success: true });
  }),

  // Error simulation
  http.get(`${BASE_URL}/error-test`, () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),
];
```

**Fichier:** `__tests__/setup.ts`

```typescript
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 3.2 Test exemple

**Fichier:** `__tests__/hooks/useCategories.test.tsx`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCategories } from '../../src/hooks/useCategories';
import { TebexProvider } from '../../src/provider/TebexProvider';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TebexProvider config={{ publicKey: 'test', baseUrl: 'http://test.com' }}>
    {children}
  </TebexProvider>
);

describe('useCategories', () => {
  it('should fetch categories successfully', async () => {
    const { result } = renderHook(() => useCategories(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toHaveLength(1);
    expect(result.current.categories?.[0].name).toBe('VIP');
    expect(result.current.errorCode).toBeNull();
  });

  it('should return error code on failure', async () => {
    server.use(
      http.get('*/accounts/categories', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.errorCode).toBe(TebexErrorCode.NETWORK_ERROR);
  });
});
```

---

## Phase 4: CI/CD & Publishing

### 4.1 GitHub Actions - CI

**Fichier:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Type check
        run: bun run typecheck

      - name: Test with coverage
        run: bun run coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 90" | bc -l) )); then
            echo "Coverage is below 90%: $COVERAGE%"
            exit 1
          fi

      - name: Build
        run: bun run build
```

### 4.2 GitHub Actions - Release (Trusted Publishing)

**Fichier:** `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for trusted publishing

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Publish to npm
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Phase 5: Package.json final

```json
{
  "name": "@neosia/tebex-nextjs",
  "version": "3.0.0",
  "description": "Tebex Headless SDK optimized for Next.js App Router",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "scripts": {
    "build": "bun run build.ts",
    "dev": "bun run build.ts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --fix",
    "format": "prettier --write .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "coverage": "vitest run --coverage",
    "prepublishOnly": "bun run build"
  },
  "peerDependencies": {
    "react": "^18.3.1 || ^19.0.0",
    "react-dom": "^18.3.1 || ^19.0.0",
    "next": "^14.0.0 || ^15.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "tebex_headless": "^1.15.0"
  },
  "peerDependenciesMeta": {
    "@tebexio/tebex.js": {
      "optional": true
    }
  },
  "devDependencies": {
    "@tanstack/react-query": "^5.62.0",
    "@tanstack/react-query-devtools": "^5.62.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "msw": "^2.6.0",
    "next": "^15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tebex_headless": "^1.15.1",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "zustand": "^5.0.0"
  },
  "keywords": [
    "tebex",
    "nextjs",
    "react",
    "headless",
    "ecommerce",
    "minecraft",
    "game-server",
    "tanstack-query"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/NeosiaNexus/tebex-nextjs.git"
  },
  "author": "NeosiaNexus <devneosianexus@gmail.com>",
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
```

---

## Migration Guide v2 -> v3

### Breaking Changes

| v2 | v3 | Action |
|----|-----|--------|
| `initTebex(key)` | `<TebexProvider config={{...}}>` | Remplacer par Provider |
| `initShopUrls(url)` | `config.baseUrl` + `config.urls` | Passer dans config |
| `useBasket(username)` | `useBasket()` + `useUser()` | Separer user et basket |
| `error.message` (FR) | `error.code` | Traduire les codes |
| `sonner` peer dep | Removed | Gerer les toasts vous-meme |

### Migration exemple

**Avant (v2):**
```tsx
// lib/tebex.ts
initTebex(process.env.NEXT_PUBLIC_TEBEX_KEY);
initShopUrls('https://mysite.com');

// Component
const { basket, addPackageToBasket, error } = useBasket(username);
if (error) toast.error(error.message); // Message FR
```

**Apres (v3):**
```tsx
// app/layout.tsx
<TebexProvider
  config={{
    publicKey: process.env.NEXT_PUBLIC_TEBEX_KEY!,
    baseUrl: 'https://mysite.com',
    onError: (err) => toast.error(t(`errors.${err.code}`)), // i18n
  }}
>
  {children}
</TebexProvider>

// Component
const { basket, addPackage, errorCode } = useBasket();
// Errors handled by onError callback
```

---

## Roadmap

| Version | Contenu |
|---------|---------|
| **3.0.0** | Core refacto (Provider, TanStack Query, error codes, tous hooks) |
| **3.1.0** | Remplacer `tebex_headless` par wrapper custom avec retry/cache |
| **3.2.0** | Optimistic updates sur mutations basket |
| **3.3.0** | SSR prefetching helpers |
| **4.0.0** | React 19 Server Components natif (si Zustand trouve solution) |

---

## Checklist implementation

- [ ] Phase 0: TypeScript Setup
  - [ ] tsconfig.json strict mode complet
  - [ ] eslint.config.js avec regles TypeScript strictes
  - [ ] Types hooks (src/types/hooks.ts)
  - [ ] Type guards (src/types/guards.ts)
  - [ ] Types config (src/types/config.ts)
  - [ ] Barrel exports types (src/types/index.ts)

- [ ] Phase 1: Core Architecture
  - [ ] TebexProvider avec QueryClient
  - [ ] TebexError et codes d'erreur
  - [ ] Query keys factory
  - [ ] Types Result<T, E>

- [ ] Phase 2: Hooks
  - [ ] useCategories (refacto)
  - [ ] useCategory
  - [ ] usePackages
  - [ ] usePackage
  - [ ] useBasket (refacto avec mutations)
  - [ ] useCheckout
  - [ ] useCoupons
  - [ ] useGiftCards
  - [ ] useCreatorCodes
  - [ ] useWebstore
  - [ ] useGiftPackage
  - [ ] useUser

- [ ] Phase 3: Tests
  - [ ] Setup MSW
  - [ ] Tests Provider
  - [ ] Tests tous hooks
  - [ ] Coverage >= 90%

- [ ] Phase 4: CI/CD
  - [ ] GitHub Actions CI
  - [ ] GitHub Actions Release (trusted publishing)
  - [ ] Configurer npm trusted publishing
  - [ ] Verifier que `bun run typecheck` passe sans erreur
  - [ ] Verifier zero `any` avec ESLint

- [ ] Phase 5: Documentation
  - [ ] README.md complet
  - [ ] Migration guide
  - [ ] Exemples Next.js App Router

---

## Estimation

| Phase | Effort |
|-------|--------|
| Phase 1 | Fondations |
| Phase 2 | Bulk du travail |
| Phase 3 | Tests robustes |
| Phase 4 | Automatisation |
| Phase 5 | Documentation |

**Note:** Pas d'estimation de temps - focus sur la qualite, pas la vitesse.
