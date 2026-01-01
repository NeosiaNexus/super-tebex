# @neosianexus/super-tebex

[![npm version](https://img.shields.io/npm/v/@neosianexus/super-tebex?color=blue)](https://www.npmjs.com/package/@neosianexus/super-tebex)
[![npm downloads](https://img.shields.io/npm/dm/@neosianexus/super-tebex)](https://www.npmjs.com/package/@neosianexus/super-tebex)
[![Coverage](https://img.shields.io/badge/coverage-97%25-brightgreen)](https://github.com/NeosiaNexus/super-tebex)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Tebex Headless SDK optimized for Next.js App Router with TanStack Query and Zustand.

## Features

- **TanStack Query v5** - Automatic caching, retry, stale-while-revalidate
- **Zustand v5** - Persisted client state (basket, user) in localStorage
- **TypeScript First** - Zero `any`, strict mode, exhaustive types
- **Provider Pattern** - Single provider, granular hooks
- **Error Codes** - i18n-friendly error handling with `TebexErrorCode` enum
- **Optimistic Updates** - Instant UI feedback on basket mutations
- **React Query DevTools** - Automatic in development mode

## Installation

```bash
npm install @neosianexus/super-tebex
# or
yarn add @neosianexus/super-tebex
# or
pnpm add @neosianexus/super-tebex
# or
bun add @neosianexus/super-tebex
```

### Peer Dependencies

```bash
npm install @tanstack/react-query zustand tebex_headless
```

| Dependency | Version |
|------------|---------|
| `react` | ^18.3.1 \|\| ^19.0.0 |
| `react-dom` | ^18.3.1 \|\| ^19.0.0 |
| `next` | ^14.0.0 \|\| ^15.0.0 (optional) |
| `@tanstack/react-query` | ^5.0.0 |
| `zustand` | ^5.0.0 |
| `tebex_headless` | ^1.15.0 |

## Quick Start

### 1. Setup Provider

Wrap your app with `TebexProvider` in your root layout:

```tsx
// app/layout.tsx
import { TebexProvider } from '@neosianexus/super-tebex';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TebexProvider
          config={{
            publicKey: process.env.NEXT_PUBLIC_TEBEX_KEY!,
            baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
            urls: {
              complete: '/shop/complete', // optional, default: /shop/complete
              cancel: '/shop/cancel',     // optional, default: /shop/cancel
            },
            onError: (error) => {
              // Global error handler (optional)
              console.error(`Tebex Error [${error.code}]:`, error.message);
            },
          }}
        >
          {children}
        </TebexProvider>
      </body>
    </html>
  );
}
```

### 2. Use Hooks

```tsx
'use client';

import { useCategories, useBasket, useUser } from '@neosianexus/super-tebex';

export function Shop() {
  const { username, setUsername } = useUser();
  const { categories, isLoading } = useCategories({ includePackages: true });
  const { addPackage, itemCount, isAddingPackage } = useBasket();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Cart: {itemCount} items</p>
      {categories?.map(category => (
        <div key={category.id}>
          <h2>{category.name}</h2>
          {category.packages?.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => addPackage({ packageId: pkg.id })}
              disabled={!username || isAddingPackage}
            >
              Add {pkg.name} - {pkg.price}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## API Reference

### Provider & Configuration

| Export | Description |
|--------|-------------|
| `TebexProvider` | Main provider component - wrap your app with this |
| `useTebexContext()` | Access QueryClient and config from context |
| `useTebexConfig()` | Access just the Tebex configuration |

#### TebexConfig

```typescript
interface TebexConfig {
  publicKey: string;       // Your Tebex public key
  baseUrl: string;         // Your site URL (for checkout redirects)
  urls?: {
    complete?: string;     // Success redirect path (default: '/shop/complete')
    cancel?: string;       // Cancel redirect path (default: '/shop/cancel')
  };
  onError?: (error: TebexError) => void;  // Global error callback
  devtools?: boolean;      // Enable React Query DevTools (default: true in dev)
}
```

---

### Hooks

#### Data Fetching Hooks

| Hook | Description |
|------|-------------|
| `useCategories(options?)` | Fetch all categories (with optional packages) |
| `useCategory(options)` | Fetch a single category by ID |
| `usePackages(options?)` | Fetch all packages (optionally by category) |
| `usePackage(options)` | Fetch a single package by ID |
| `useWebstore()` | Fetch webstore info (name, currency, domain) |

#### Basket Management Hooks

| Hook | Description |
|------|-------------|
| `useBasket()` | Full basket management with optimistic updates |
| `useCheckout(options?)` | Launch Tebex.js checkout modal |
| `useCoupons()` | Apply/remove coupon codes |
| `useGiftCards()` | Apply/remove gift cards |
| `useCreatorCodes()` | Apply/remove creator codes |
| `useGiftPackage()` | Gift a package to another user |

#### User Management Hooks

| Hook | Description |
|------|-------------|
| `useUser()` | Username management (persisted in localStorage) |

---

### Hook Details

#### useBasket

```typescript
const {
  // Data
  basket,           // Basket | null
  packages,         // BasketPackage[]
  basketIdent,      // string | null
  itemCount,        // number
  total,            // number
  isEmpty,          // boolean

  // Loading states
  isLoading,
  isFetching,
  isAddingPackage,
  isRemovingPackage,
  isUpdatingQuantity,

  // Error handling
  error,            // TebexError | null
  errorCode,        // TebexErrorCode | null

  // Actions
  addPackage,       // (params: AddPackageParams) => Promise<void>
  removePackage,    // (packageId: number) => Promise<void>
  updateQuantity,   // (params: UpdateQuantityParams) => Promise<void>
  clearBasket,      // () => void
  refetch,          // () => Promise<...>
} = useBasket();

// Add package with options
await addPackage({
  packageId: 123,
  quantity: 2,                          // optional, default: 1
  type: 'single',                       // optional: 'single' | 'subscription'
  variableData: { server: 'survival' }, // optional
});
```

#### useCategories

```typescript
const {
  categories,  // Category[] | null
  data,        // same as categories
  isLoading,
  isFetching,
  error,
  errorCode,
  refetch,

  // Helpers
  getByName,   // (name: string) => Category | undefined
  getById,     // (id: number) => Category | undefined
} = useCategories({
  includePackages: true,  // default: true
  enabled: true,          // default: true
});
```

#### usePackages

```typescript
const {
  packages,    // Package[] | null
  data,        // same as packages
  isLoading,
  isFetching,
  error,
  errorCode,
  refetch,

  // Helpers
  getById,     // (id: number) => Package | undefined
  getByName,   // (name: string) => Package | undefined
} = usePackages({
  categoryId: 123,  // optional: filter by category
  enabled: true,    // default: true
});
```

#### useCheckout

```typescript
const {
  launch,       // () => Promise<void>
  isLaunching,
  error,
  errorCode,
  canCheckout,  // boolean - true if basket has items
  checkoutUrl,  // string | null - direct checkout URL
} = useCheckout({
  onSuccess: () => console.log('Payment complete!'),
  onError: (error) => console.error(error),
  onClose: () => console.log('Checkout closed'),
});

// IMPORTANT: Requires Tebex.js script in your page
// <script src="https://js.tebex.io/v/1.1.js" async />
```

#### useUser

```typescript
const {
  username,        // string | null
  setUsername,     // (username: string) => void
  clearUsername,   // () => void
  isAuthenticated, // boolean
} = useUser();
```

#### useCoupons

```typescript
const {
  coupons,     // Code[]
  apply,       // (code: string) => Promise<void>
  remove,      // (code: string) => Promise<void>
  isApplying,
  isRemoving,
  error,
  errorCode,
} = useCoupons();
```

#### useGiftCards

```typescript
const {
  giftCards,   // GiftCardCode[]
  apply,       // (code: string) => Promise<void>
  remove,      // (code: string) => Promise<void>
  isApplying,
  isRemoving,
  error,
  errorCode,
} = useGiftCards();
```

#### useCreatorCodes

```typescript
const {
  creatorCode, // string | null
  apply,       // (code: string) => Promise<void>
  remove,      // () => Promise<void>
  isApplying,
  isRemoving,
  error,
  errorCode,
} = useCreatorCodes();
```

#### useGiftPackage

```typescript
const {
  gift,        // (params: GiftPackageParams) => Promise<void>
  isGifting,
  error,
  errorCode,
} = useGiftPackage();

// Gift a package to another player
await gift({
  packageId: 123,
  targetUsername: 'friend_username',
});
```

#### useWebstore

```typescript
const {
  webstore,    // Webstore | null
  name,        // string | null
  currency,    // string | null
  domain,      // string | null
  isLoading,
  isFetching,
  error,
  errorCode,
  refetch,
} = useWebstore();
```

---

## Error Handling

All hooks expose `error` (TebexError) and `errorCode` (TebexErrorCode) for i18n-friendly error handling:

```typescript
import { TebexErrorCode } from '@neosianexus/super-tebex';

const { error, errorCode } = useBasket();

// Use error codes for translations
const errorMessages: Record<TebexErrorCode, string> = {
  [TebexErrorCode.NOT_AUTHENTICATED]: 'Please log in first',
  [TebexErrorCode.BASKET_NOT_FOUND]: 'Your cart has expired',
  [TebexErrorCode.PACKAGE_OUT_OF_STOCK]: 'Item is out of stock',
  // ...
};

if (errorCode) {
  toast.error(errorMessages[errorCode] ?? 'An error occurred');
}
```

### All Error Codes

| Category | Codes |
|----------|-------|
| **Provider** | `PROVIDER_NOT_FOUND`, `INVALID_CONFIG` |
| **Auth** | `NOT_AUTHENTICATED`, `INVALID_USERNAME` |
| **Basket** | `BASKET_NOT_FOUND`, `BASKET_CREATION_FAILED`, `BASKET_EXPIRED`, `BASKET_EMPTY` |
| **Package** | `PACKAGE_NOT_FOUND`, `PACKAGE_OUT_OF_STOCK`, `PACKAGE_ALREADY_OWNED`, `INVALID_QUANTITY` |
| **Category** | `CATEGORY_NOT_FOUND` |
| **Coupon** | `COUPON_INVALID`, `COUPON_EXPIRED`, `COUPON_ALREADY_USED` |
| **Gift Card** | `GIFTCARD_INVALID`, `GIFTCARD_INSUFFICIENT_BALANCE` |
| **Creator Code** | `CREATOR_CODE_INVALID` |
| **Checkout** | `CHECKOUT_FAILED`, `CHECKOUT_CANCELLED`, `TEBEX_JS_NOT_LOADED` |
| **Network** | `NETWORK_ERROR`, `TIMEOUT`, `RATE_LIMITED` |
| **Unknown** | `UNKNOWN` |

---

## TypeScript

All types are exported:

```typescript
import type {
  // Config
  TebexConfig,
  TebexUrls,
  ResolvedTebexConfig,

  // Hook Returns
  UseBasketReturn,
  UseCategoriesReturn,
  UseCategoriesOptions,
  UseCategoryReturn,
  UseCategoryOptions,
  UsePackagesReturn,
  UsePackagesOptions,
  UsePackageReturn,
  UsePackageOptions,
  UseCheckoutReturn,
  UseCheckoutOptions,
  UseCouponsReturn,
  UseGiftCardsReturn,
  UseCreatorCodesReturn,
  UseGiftPackageReturn,
  UseWebstoreReturn,
  UseUserReturn,

  // Params
  AddPackageParams,
  UpdateQuantityParams,
  GiftPackageParams,

  // Base types
  BaseQueryReturn,
  BaseMutationReturn,

  // Tebex API types (re-exported from tebex_headless)
  Basket,
  BasketPackage,
  Category,
  Package,
  PackageType,
  Webstore,
  Code,
  GiftCardCode,

  // Utilities
  Result,
} from '@neosianexus/super-tebex';

// Error handling
import { TebexError, TebexErrorCode } from '@neosianexus/super-tebex';

// Type guards
import {
  isTebexError,  // (error: unknown) => error is TebexError
  isSuccess,     // (result: Result<T,E>) => result is { ok: true, data: T }
  isError,       // (result: Result<T,E>) => result is { ok: false, error: E }
  isDefined,     // <T>(value: T | null | undefined) => value is T
} from '@neosianexus/super-tebex';

// Result utilities
import { ok, err } from '@neosianexus/super-tebex';
```

---

## Zustand Stores

Direct store access for advanced use cases:

```typescript
import { useBasketStore, useUserStore } from '@neosianexus/super-tebex';

// Access stores directly (outside of hooks)
const basketIdent = useBasketStore(state => state.basketIdent);
const setBasketIdent = useBasketStore(state => state.setBasketIdent);
const clearBasketIdent = useBasketStore(state => state.clearBasketIdent);

const username = useUserStore(state => state.username);
const setUsername = useUserStore(state => state.setUsername);
const clearUsername = useUserStore(state => state.clearUsername);
```

---

## Query Keys

For manual cache invalidation:

```typescript
import { tebexKeys } from '@neosianexus/super-tebex';
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Available keys
tebexKeys.all              // ['tebex']
tebexKeys.categories()     // ['tebex', 'categories']
tebexKeys.categoriesList() // ['tebex', 'categories', 'list']
tebexKeys.category(id)     // ['tebex', 'categories', id]
tebexKeys.packages()       // ['tebex', 'packages']
tebexKeys.packagesList()   // ['tebex', 'packages', 'list']
tebexKeys.package(id)      // ['tebex', 'packages', id]
tebexKeys.baskets()        // ['tebex', 'baskets']
tebexKeys.basket(ident)    // ['tebex', 'baskets', ident]
tebexKeys.webstore()       // ['tebex', 'webstore']

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: tebexKeys.categories() });
queryClient.invalidateQueries({ queryKey: tebexKeys.basket(basketIdent) });
```

---

## Advanced Usage

### Custom QueryClient

```typescript
import { QueryClient } from '@tanstack/react-query';
import { TebexProvider } from '@neosianexus/super-tebex';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

<TebexProvider config={config} queryClient={queryClient}>
  {children}
</TebexProvider>
```

### Direct API Client Access

For advanced scenarios requiring direct API access:

```typescript
import { getTebexClient, isTebexClientInitialized } from '@neosianexus/super-tebex';

if (isTebexClientInitialized()) {
  const client = getTebexClient();
  // Use client directly (advanced usage only)
}
```

---

## Complete Example

```tsx
'use client';

import { useCategories, useBasket, useUser, useCheckout } from '@neosianexus/super-tebex';
import { useState } from 'react';

export default function ShopPage() {
  const [input, setInput] = useState('');

  // User
  const { username, setUsername, clearUsername } = useUser();

  // Categories
  const { categories, isLoading: categoriesLoading } = useCategories({
    includePackages: true,
  });

  // Basket
  const {
    basket,
    packages,
    addPackage,
    removePackage,
    itemCount,
    total,
    isAddingPackage,
    isEmpty,
  } = useBasket();

  // Checkout
  const { launch, canCheckout, isLaunching } = useCheckout({
    onSuccess: () => alert('Thank you for your purchase!'),
  });

  // Login handler
  const handleLogin = () => {
    if (input.trim()) {
      setUsername(input.trim());
      setInput('');
    }
  };

  if (categoriesLoading) {
    return <div>Loading store...</div>;
  }

  return (
    <div className="container">
      {/* Auth Section */}
      <header>
        {username ? (
          <div>
            <span>Welcome, {username}</span>
            <button onClick={clearUsername}>Logout</button>
          </div>
        ) : (
          <div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter username"
            />
            <button onClick={handleLogin}>Login</button>
          </div>
        )}
      </header>

      <main>
        {/* Products */}
        <section>
          <h1>Products</h1>
          {categories?.map(category => (
            <div key={category.id}>
              <h2>{category.name}</h2>
              <div className="grid">
                {category.packages?.map(pkg => (
                  <div key={pkg.id} className="card">
                    <h3>{pkg.name}</h3>
                    <p>{pkg.price}</p>
                    <button
                      onClick={() => addPackage({ packageId: pkg.id })}
                      disabled={!username || isAddingPackage}
                    >
                      {isAddingPackage ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Cart */}
        <aside>
          <h2>Cart ({itemCount})</h2>
          {isEmpty ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <ul>
                {packages.map(pkg => (
                  <li key={pkg.id}>
                    {pkg.name} x{pkg.in_basket.quantity}
                    <button onClick={() => removePackage(pkg.id)}>Remove</button>
                  </li>
                ))}
              </ul>
              <p>Total: {basket?.base_price}</p>
              <button
                onClick={launch}
                disabled={!canCheckout || isLaunching}
              >
                {isLaunching ? 'Loading...' : 'Checkout'}
              </button>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
```

---

## Migration from v2

### Breaking Changes

| v2 | v3 | Migration |
|----|-----|-----------|
| `initTebex(key)` | `<TebexProvider config={{...}}>` | Wrap app with Provider |
| `initShopUrls(url)` | `config.baseUrl` + `config.urls` | Pass in config |
| `useBasket(username)` | `useBasket()` + `useUser()` | User is separate |
| `error.message` (FR) | `error.code` | Translate codes yourself |
| `sonner` peer dep | Removed | Handle toasts yourself |
| `useShopUserStore` | `useUserStore` | Renamed |
| `useShopBasketStore` | `useBasketStore` | Renamed |

### Migration Example

**Before (v2):**

```tsx
// lib/tebex.ts
initTebex(process.env.NEXT_PUBLIC_TEBEX_KEY);
initShopUrls('https://mysite.com');

// Component
const username = useShopUserStore(s => s.username);
const { basket, addPackageToBasket, error } = useBasket(username);

if (error) toast.error(error.message); // French message
```

**After (v3):**

```tsx
// app/layout.tsx
<TebexProvider
  config={{
    publicKey: process.env.NEXT_PUBLIC_TEBEX_KEY!,
    baseUrl: 'https://mysite.com',
    onError: (err) => toast.error(t(`errors.${err.code}`)),
  }}
>
  {children}
</TebexProvider>

// Component
const { username } = useUser();
const { basket, addPackage, errorCode } = useBasket();

// Errors handled by onError callback or manually with errorCode
```

---

## Quick Reference for AI/LLM

<details>
<summary><strong>Click to expand - Structured reference for AI assistants</strong></summary>

### Package Info
- **Name**: `@neosianexus/super-tebex`
- **Purpose**: Tebex Headless SDK wrapper for React/Next.js
- **State**: TanStack Query v5 (server) + Zustand v5 (client)

### Common Patterns

```typescript
// 1. Setup (app/layout.tsx)
<TebexProvider config={{ publicKey, baseUrl }}>{children}</TebexProvider>

// 2. Get categories with packages
const { categories } = useCategories({ includePackages: true });

// 3. Add to basket
const { addPackage } = useBasket();
await addPackage({ packageId: 123 });

// 4. Checkout
const { launch, canCheckout } = useCheckout();
if (canCheckout) await launch();

// 5. User management
const { username, setUsername } = useUser();
setUsername('player_name');
```

### Hook Signatures

| Hook | Key Params | Key Returns |
|------|------------|-------------|
| `useCategories(opts?)` | `includePackages` | `categories`, `getById`, `getByName` |
| `useCategory(opts)` | `id` | `category` |
| `usePackages(opts?)` | `categoryId` | `packages`, `getById`, `getByName` |
| `usePackage(opts)` | `id` | `package` |
| `useWebstore()` | - | `webstore`, `name`, `currency`, `domain` |
| `useBasket()` | - | `basket`, `addPackage`, `removePackage`, `itemCount` |
| `useCheckout(opts?)` | `onSuccess`, `onError` | `launch`, `canCheckout`, `isLaunching` |
| `useUser()` | - | `username`, `setUsername`, `isAuthenticated` |
| `useCoupons()` | - | `coupons`, `apply`, `remove` |
| `useGiftCards()` | - | `giftCards`, `apply`, `remove` |
| `useCreatorCodes()` | - | `creatorCode`, `apply`, `remove` |
| `useGiftPackage()` | - | `gift`, `isGifting` |

### Error Handling Pattern

```typescript
const { errorCode } = useBasket();
if (errorCode === TebexErrorCode.BASKET_NOT_FOUND) {
  // Handle expired basket
}
```

### Requirements
- Must wrap app with `TebexProvider`
- Checkout requires `<script src="https://js.tebex.io/v/1.1.js" async />`
- Username required before adding to basket

</details>

---

## License

MIT

---

## Links

- [GitHub Repository](https://github.com/NeosiaNexus/super-tebex)
- [NPM Package](https://www.npmjs.com/package/@neosianexus/super-tebex)
- [Tebex Documentation](https://docs.tebex.io/)
- [Report Issues](https://github.com/NeosiaNexus/super-tebex/issues)
