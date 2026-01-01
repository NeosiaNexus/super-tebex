# @neosia/tebex-nextjs

Tebex Headless SDK optimized for Next.js App Router with TanStack Query and Zustand.

## Features

- **TanStack Query v5** - Automatic caching, retry, stale-while-revalidate
- **Zustand v5** - Persisted client state (basket, user)
- **TypeScript First** - Zero `any`, strict mode, exhaustive types
- **Provider Pattern** - Single provider, granular hooks
- **Error Codes** - i18n-friendly error handling with `TebexErrorCode`
- **Optimistic Updates** - Instant UI feedback on basket mutations
- **React Query DevTools** - Automatic in development mode

## Installation

```bash
npm install @neosia/tebex-nextjs
# or
yarn add @neosia/tebex-nextjs
# or
pnpm add @neosia/tebex-nextjs
# or
bun add @neosia/tebex-nextjs
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
import { TebexProvider } from '@neosia/tebex-nextjs';

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

import { useCategories, useBasket, useUser } from '@neosia/tebex-nextjs';

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

## Available Hooks

### Data Fetching Hooks

| Hook | Description |
|------|-------------|
| `useCategories()` | Fetch all categories (with optional packages) |
| `useCategory(id)` | Fetch a single category by ID |
| `usePackages()` | Fetch all packages |
| `usePackage(id)` | Fetch a single package by ID |
| `useWebstore()` | Fetch webstore info (name, currency, domain) |

### Basket Management

| Hook | Description |
|------|-------------|
| `useBasket()` | Full basket management with optimistic updates |
| `useCheckout()` | Launch Tebex.js checkout modal |
| `useCoupons()` | Apply/remove coupon codes |
| `useGiftCards()` | Apply/remove gift cards |
| `useCreatorCodes()` | Apply/remove creator codes |
| `useGiftPackage()` | Gift a package to another user |

### User Management

| Hook | Description |
|------|-------------|
| `useUser()` | Username management (persisted in localStorage) |

## Hook Examples

### useBasket

```tsx
const {
  basket,           // Basket | null
  packages,         // BasketPackage[]
  basketIdent,      // string | null

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

  // Computed
  itemCount,        // number
  total,            // number
  isEmpty,          // boolean
} = useBasket();

// Add package with options
await addPackage({
  packageId: 123,
  quantity: 2,
  type: 'single',  // optional: 'single' | 'subscription'
  variableData: { server: 'survival' },  // optional
});
```

### useCategories

```tsx
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

### useCheckout

```tsx
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

// Requires Tebex.js script in your page
// <script src="https://js.tebex.io/v/1.js" />
```

### useUser

```tsx
const {
  username,        // string | null
  setUsername,     // (username: string) => void
  clearUsername,   // () => void
  isAuthenticated, // boolean
} = useUser();
```

### useCoupons

```tsx
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

## Error Handling

All hooks expose `error` (TebexError) and `errorCode` (TebexErrorCode) for i18n-friendly error handling:

```tsx
import { TebexErrorCode } from '@neosia/tebex-nextjs';

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

### Available Error Codes

| Category | Codes |
|----------|-------|
| Provider | `PROVIDER_NOT_FOUND`, `INVALID_CONFIG` |
| Auth | `NOT_AUTHENTICATED`, `INVALID_USERNAME` |
| Basket | `BASKET_NOT_FOUND`, `BASKET_CREATION_FAILED`, `BASKET_EXPIRED` |
| Package | `PACKAGE_NOT_FOUND`, `PACKAGE_OUT_OF_STOCK`, `PACKAGE_ALREADY_OWNED`, `INVALID_QUANTITY` |
| Category | `CATEGORY_NOT_FOUND` |
| Coupon | `COUPON_INVALID`, `COUPON_EXPIRED`, `COUPON_ALREADY_USED` |
| Gift Card | `GIFTCARD_INVALID`, `GIFTCARD_INSUFFICIENT_BALANCE` |
| Creator Code | `CREATOR_CODE_INVALID` |
| Checkout | `CHECKOUT_FAILED`, `CHECKOUT_CANCELLED` |
| Network | `NETWORK_ERROR`, `TIMEOUT`, `RATE_LIMITED` |
| Unknown | `UNKNOWN` |

## TypeScript

All types are exported:

```tsx
import type {
  // Config
  TebexConfig,
  TebexUrls,

  // Hook Returns
  UseBasketReturn,
  UseCategoriesReturn,
  UseCheckoutReturn,
  // ... all hook return types

  // Tebex API types
  Basket,
  BasketPackage,
  Category,
  Package,
  Webstore,

  // Utilities
  Result,
  TebexError,
  TebexErrorCode,
} from '@neosia/tebex-nextjs';

// Type guards
import { isTebexError, isSuccess, isError, isDefined } from '@neosia/tebex-nextjs';
```

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

## Complete Example

```tsx
'use client';

import { useCategories, useBasket, useUser, useCheckout } from '@neosia/tebex-nextjs';
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

## Advanced Usage

### Custom QueryClient

```tsx
import { QueryClient } from '@tanstack/react-query';
import { TebexProvider } from '@neosia/tebex-nextjs';

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

### Direct Store Access

```tsx
import { useBasketStore, useUserStore } from '@neosia/tebex-nextjs';

// Access stores directly (outside of hooks)
const basketIdent = useBasketStore(state => state.basketIdent);
const username = useUserStore(state => state.username);
```

### Query Keys

```tsx
import { tebexKeys } from '@neosia/tebex-nextjs';
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: tebexKeys.categories() });
queryClient.invalidateQueries({ queryKey: tebexKeys.basket(basketIdent) });
```

## License

MIT
