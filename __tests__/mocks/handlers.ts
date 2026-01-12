import { delay, http, HttpResponse } from 'msw';

const BASE_URL = 'https://headless.tebex.io/api';

// Wildcard for webstore identifier (public key)
const ACCOUNTS_URL = `${BASE_URL}/accounts/:webstoreId`;
const BASKETS_URL = `${BASE_URL}/baskets/:basketIdent`;

/**
 * Mock package from categories
 */
interface MockPackage {
  id: number;
  name: string;
  description: string;
  type: string;
  base_price: number;
  sales_price: number;
  total_price: number;
  currency: string;
  image: null;
  category: { id: number; name: string };
  discount: number;
  gift_username_required: boolean;
}

/**
 * In-memory state for baskets during tests
 * Maps basketIdent to basket data with packages
 */
interface BasketPackageState {
  id: number;
  name: string;
  description: string;
  base_price: number;
  in_basket: {
    quantity: number;
    price: number;
    gift_username: string | null;
  };
}

interface BasketState {
  ident: string;
  username: string | null;
  packages: BasketPackageState[];
  coupons: Array<{ code: string; discount: number }>;
  giftcards: Array<{ card_number: string; balance: number }>;
  creator_code: string | null;
}

const basketsState = new Map<string, BasketState>();

/**
 * Reset basket state between tests
 */
export function resetMockState(): void {
  basketsState.clear();
}

/**
 * Mock data for tests
 */
export const mockData = {
  webstore: {
    id: 1,
    name: 'Test Store',
    description: 'A test store',
    currency: { iso_4217: 'EUR', symbol: '€' },
    webstore_url: 'test.tebex.io',
    logo: '',
  },
  categories: [
    {
      id: 1,
      name: 'VIP',
      slug: 'vip',
      description: 'VIP packages',
      packages: [
        {
          id: 101,
          name: 'VIP Gold',
          description: 'Gold VIP package',
          type: 'single',
          base_price: 9.99,
          sales_price: 9.99,
          total_price: 9.99,
          currency: 'EUR',
          image: null,
          category: { id: 1, name: 'VIP' },
          discount: 0,
          gift_username_required: false,
        },
        {
          id: 102,
          name: 'VIP Diamond',
          description: 'Diamond VIP package',
          type: 'single',
          base_price: 19.99,
          sales_price: 19.99,
          total_price: 19.99,
          currency: 'EUR',
          image: null,
          category: { id: 1, name: 'VIP' },
          discount: 0,
          gift_username_required: false,
        },
      ],
    },
    {
      id: 2,
      name: 'Cosmetics',
      slug: 'cosmetics',
      description: 'Cosmetic items',
      packages: [
        {
          id: 201,
          name: 'Pet Pack',
          description: 'Cute pets',
          type: 'single',
          base_price: 4.99,
          sales_price: 4.99,
          total_price: 4.99,
          currency: 'EUR',
          image: null,
          category: { id: 2, name: 'Cosmetics' },
          discount: 0,
          gift_username_required: false,
        },
      ],
    },
  ],
  basket: {
    ident: 'test-basket-123',
    complete: false,
    id: 1,
    country: 'FR',
    ip: '127.0.0.1',
    username: 'TestPlayer',
    base_price: { amount: 0, currency: 'EUR' },
    sales_tax: { amount: 0, currency: 'EUR' },
    total_price: 0,
    packages: [],
    coupons: [],
    giftcards: [],
    creator_code: null,
    links: {
      checkout: 'https://checkout.tebex.io/test',
    },
  },
};

/**
 * MSW handlers for Tebex API
 * URL format: /api/{route}/{identifier}{path}
 * - accounts routes: /api/accounts/{webstoreId}/...
 * - baskets routes: /api/baskets/{basketIdent}/...
 */
export const handlers = [
  // GET /api/accounts/:webstoreId - Webstore info
  http.get(ACCOUNTS_URL, () => {
    return HttpResponse.json({ data: mockData.webstore });
  }),

  // GET /api/accounts/:webstoreId/categories - List categories
  http.get(`${ACCOUNTS_URL}/categories`, ({ request }) => {
    const url = new URL(request.url);
    const includePackages = url.searchParams.get('includePackages') === '1';

    const categories = mockData.categories.map(cat => ({
      ...cat,
      packages: includePackages ? cat.packages : [],
    }));

    return HttpResponse.json({ data: categories });
  }),

  // GET /api/accounts/:webstoreId/categories/:id - Single category
  http.get(`${ACCOUNTS_URL}/categories/:id`, ({ params }) => {
    const id = Number(params.id);
    const category = mockData.categories.find(c => c.id === id);

    if (category === undefined) {
      return HttpResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return HttpResponse.json({ data: category });
  }),

  // GET /api/accounts/:webstoreId/packages - List all packages
  http.get(`${ACCOUNTS_URL}/packages`, () => {
    const allPackages = mockData.categories.flatMap(cat => cat.packages);
    return HttpResponse.json({ data: allPackages });
  }),

  // GET /api/accounts/:webstoreId/packages/:id - Single package
  http.get(`${ACCOUNTS_URL}/packages/:id`, ({ params }) => {
    const id = Number(params.id);

    for (const category of mockData.categories) {
      const pkg = category.packages.find(p => p.id === id);
      if (pkg !== undefined) {
        return HttpResponse.json({ data: pkg });
      }
    }

    return HttpResponse.json({ error: 'Package not found' }, { status: 404 });
  }),

  // POST /api/accounts/:webstoreId/baskets - Create basket
  http.post(`${ACCOUNTS_URL}/baskets`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const username = body.username as string | undefined;
    const ident = `basket-${Date.now()}`;

    // Store initial basket state
    basketsState.set(ident, {
      ident,
      username: username ?? null,
      packages: [],
      coupons: [],
      giftcards: [],
      creator_code: null,
    });

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        username: username ?? null,
        ident,
      },
    });
  }),

  // GET /api/accounts/:webstoreId/baskets/:basketIdent - Get basket
  http.get(`${ACCOUNTS_URL}/baskets/:basketIdent`, ({ params }) => {
    const ident = params.basketIdent as string;
    const state = basketsState.get(ident);

    // Calculate total from packages
    const packages = state?.packages ?? [];
    const totalPrice = packages.reduce((sum, pkg) => sum + pkg.in_basket.price, 0);

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        packages: packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          image: null,
          in_basket: pkg.in_basket,
        })),
        total_price: totalPrice,
        coupons: state?.coupons ?? [],
        giftcards: state?.giftcards ?? [],
        creator_code: state?.creator_code ?? null,
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/coupons - Apply coupon
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/coupons`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const couponCode = body.coupon_code as string;
    const ident = params.basketIdent as string;

    if (couponCode === 'INVALID') {
      return HttpResponse.json({ error: 'Invalid coupon' }, { status: 400 });
    }

    // Update basket state with coupon
    const state = basketsState.get(ident);
    if (state) {
      state.coupons = [{ code: couponCode, discount: 10 }];
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        coupons: [{ code: couponCode, discount: 10 }],
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/coupons/remove - Remove coupon
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/coupons/remove`, ({ params }) => {
    const ident = params.basketIdent as string;

    // Update basket state - remove coupons
    const state = basketsState.get(ident);
    if (state) {
      state.coupons = [];
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        coupons: [],
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/giftcards - Apply giftcard
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/giftcards`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const cardNumber = body.card_number as string;
    const ident = params.basketIdent as string;

    // Update basket state with giftcard
    const state = basketsState.get(ident);
    if (state) {
      state.giftcards = [{ card_number: cardNumber, balance: 25 }];
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        giftcards: [{ card_number: cardNumber, balance: 25 }],
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/giftcards/remove - Remove giftcard
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/giftcards/remove`, ({ params }) => {
    const ident = params.basketIdent as string;

    // Update basket state - remove giftcards
    const state = basketsState.get(ident);
    if (state) {
      state.giftcards = [];
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        giftcards: [],
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/creator-codes - Apply creator code
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/creator-codes`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const creatorCode = body.creator_code as string;
    const ident = params.basketIdent as string;

    // Update basket state with creator code
    const state = basketsState.get(ident);
    if (state) {
      state.creator_code = creatorCode;
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        creator_code: creatorCode,
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/creator-codes/remove - Remove creator code
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/creator-codes/remove`, ({ params }) => {
    const ident = params.basketIdent as string;

    // Update basket state - remove creator code
    const state = basketsState.get(ident);
    if (state) {
      state.creator_code = null;
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        creator_code: null,
      },
    });
  }),

  // GET /api/accounts/:webstoreId/baskets/:basketIdent/auth - Get auth URLs
  http.get(`${ACCOUNTS_URL}/baskets/:basketIdent/auth`, ({ params, request }) => {
    const url = new URL(request.url);
    const returnUrl = url.searchParams.get('returnUrl') ?? 'https://example.com';

    return HttpResponse.json([
      {
        name: 'Steam',
        url: `https://checkout.tebex.io/auth/steam?basket=${params.basketIdent}&return=${returnUrl}`,
      },
    ]);
  }),

  // POST /api/baskets/:basketIdent/packages - Add package to basket
  http.post(`${BASKETS_URL}/packages`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const packageId = body.package_id as number;
    const quantity = (body.quantity as number) ?? 1;
    const ident = params.basketIdent as string;

    // Find the package
    let foundPkg: MockPackage | undefined;
    for (const category of mockData.categories) {
      const pkg = category.packages.find(p => p.id === packageId);
      if (pkg !== undefined) {
        foundPkg = pkg;
        break;
      }
    }

    if (foundPkg === undefined) {
      return HttpResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Update basket state
    let state = basketsState.get(ident);
    if (!state) {
      state = {
        ident,
        username: null,
        packages: [],
        coupons: [],
        giftcards: [],
        creator_code: null,
      };
      basketsState.set(ident, state);
    }

    // Check if package already exists
    const existingIndex = state.packages.findIndex(p => p.id === packageId);
    if (existingIndex >= 0) {
      state.packages[existingIndex].in_basket.quantity += quantity;
      state.packages[existingIndex].in_basket.price =
        foundPkg.base_price * state.packages[existingIndex].in_basket.quantity;
    } else {
      state.packages.push({
        id: foundPkg.id,
        name: foundPkg.name,
        description: foundPkg.description,
        base_price: foundPkg.base_price,
        in_basket: {
          quantity,
          price: foundPkg.base_price * quantity,
          gift_username: null,
        },
      });
    }

    const totalPrice = state.packages.reduce((sum, pkg) => sum + pkg.in_basket.price, 0);

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        packages: state.packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          image: null,
          in_basket: pkg.in_basket,
        })),
        total_price: totalPrice,
      },
    });
  }),

  // POST /api/baskets/:basketIdent/packages/remove - Remove package
  http.post(`${BASKETS_URL}/packages/remove`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const packageId = body.package_id as number;
    const ident = params.basketIdent as string;

    // Update basket state
    const state = basketsState.get(ident);
    if (state) {
      state.packages = state.packages.filter(p => p.id !== packageId);
    }

    const packages = state?.packages ?? [];
    const totalPrice = packages.reduce((sum, pkg) => sum + pkg.in_basket.price, 0);

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        packages: packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          image: null,
          in_basket: pkg.in_basket,
        })),
        total_price: totalPrice,
      },
    });
  }),

  // PUT /api/baskets/:basketIdent/packages/:packageId - Update quantity
  http.put(`${BASKETS_URL}/packages/:packageId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const quantity = body.quantity as number;
    const packageId = Number(params.packageId);
    const ident = params.basketIdent as string;

    // Find the package info
    let foundPkg: MockPackage | undefined;
    for (const category of mockData.categories) {
      const pkg = category.packages.find(p => p.id === packageId);
      if (pkg !== undefined) {
        foundPkg = pkg;
        break;
      }
    }

    // Update basket state
    const state = basketsState.get(ident);
    if (state && foundPkg !== undefined) {
      const pkgIndex = state.packages.findIndex(p => p.id === packageId);
      if (pkgIndex >= 0) {
        state.packages[pkgIndex].in_basket.quantity = quantity;
        state.packages[pkgIndex].in_basket.price = foundPkg.base_price * quantity;
      }
    }

    const packages = state?.packages ?? [];
    const totalPrice = packages.reduce((sum, pkg) => sum + pkg.in_basket.price, 0);

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident,
        packages: packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          image: null,
          in_basket: pkg.in_basket,
        })),
        total_price: totalPrice,
      },
    });
  }),

  // GET /api/accounts/:webstoreId/pages - Get CMS pages
  http.get(`${ACCOUNTS_URL}/pages`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, title: 'Terms of Service', slug: 'tos', content: 'Terms content...' },
        { id: 2, title: 'Privacy Policy', slug: 'privacy', content: 'Privacy content...' },
      ],
    });
  }),
];

/**
 * Webstore with logo for testing logo transformation
 */
export const mockWebstoreWithLogo = {
  ...mockData.webstore,
  logo: 'https://cdn.tebex.io/stores/test/logo.png',
};

// ============================================================================
// ERROR HANDLERS FOR NETWORK ERROR TESTING
// ============================================================================

/**
 * Create a handler that returns HTTP 500 Internal Server Error
 */
export function createServerErrorHandler(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
): ReturnType<typeof http.get> {
  const handler = http[method];
  return handler(path, () => {
    return HttpResponse.json(
      { error: 'Internal Server Error', message: 'Something went wrong on the server' },
      { status: 500 },
    );
  });
}

/**
 * Create a handler that returns HTTP 503 Service Unavailable
 */
export function createServiceUnavailableHandler(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
): ReturnType<typeof http.get> {
  const handler = http[method];
  return handler(path, () => {
    return HttpResponse.json(
      { error: 'Service Unavailable', message: 'Server is temporarily unavailable' },
      { status: 503 },
    );
  });
}

/**
 * Create a handler that returns HTTP 429 Rate Limited
 */
export function createRateLimitedHandler(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
): ReturnType<typeof http.get> {
  const handler = http[method];
  return handler(path, () => {
    return HttpResponse.json(
      { error: 'Rate Limited', message: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  });
}

/**
 * Create a handler that simulates network timeout
 */
export function createTimeoutHandler(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  delayMs: number = 10000,
): ReturnType<typeof http.get> {
  const handler = http[method];
  return handler(path, async () => {
    await delay(delayMs);
    return HttpResponse.error();
  });
}

/**
 * Create a handler that returns malformed JSON
 */
export function createMalformedJsonHandler(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
): ReturnType<typeof http.get> {
  const handler = http[method];
  return handler(path, () => {
    return new HttpResponse('{ invalid json here', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Create a handler that returns network error
 */
export function createNetworkErrorHandler(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
): ReturnType<typeof http.get> {
  const handler = http[method];
  return handler(path, () => {
    return HttpResponse.error();
  });
}

/**
 * Create a handler that returns empty response body
 */
export function createEmptyResponseHandler(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
): ReturnType<typeof http.get> {
  const handler = http[method];
  return handler(path, () => {
    return new HttpResponse(null, { status: 200 });
  });
}

// Pre-built error handlers for common endpoints
export const errorHandlers = {
  // Webstore errors
  webstore500: createServerErrorHandler('get', ACCOUNTS_URL),
  webstore503: createServiceUnavailableHandler('get', ACCOUNTS_URL),
  webstoreTimeout: createTimeoutHandler('get', ACCOUNTS_URL, 100),

  // Categories errors
  categories500: createServerErrorHandler('get', `${ACCOUNTS_URL}/categories`),
  categories503: createServiceUnavailableHandler('get', `${ACCOUNTS_URL}/categories`),
  categoriesTimeout: createTimeoutHandler('get', `${ACCOUNTS_URL}/categories`, 100),

  // Packages errors
  packages500: createServerErrorHandler('get', `${ACCOUNTS_URL}/packages`),
  packages503: createServiceUnavailableHandler('get', `${ACCOUNTS_URL}/packages`),

  // Basket creation errors
  basketCreate500: createServerErrorHandler('post', `${ACCOUNTS_URL}/baskets`),
  basketCreate503: createServiceUnavailableHandler('post', `${ACCOUNTS_URL}/baskets`),
  basketCreate429: createRateLimitedHandler('post', `${ACCOUNTS_URL}/baskets`),

  // Add package errors
  addPackage500: createServerErrorHandler('post', `${BASKETS_URL}/packages`),
  addPackage503: createServiceUnavailableHandler('post', `${BASKETS_URL}/packages`),

  // Remove package errors
  removePackage500: createServerErrorHandler('post', `${BASKETS_URL}/packages/remove`),
  removePackage503: createServiceUnavailableHandler('post', `${BASKETS_URL}/packages/remove`),

  // Update quantity errors
  updateQuantity500: createServerErrorHandler('put', `${BASKETS_URL}/packages/:packageId`),
  updateQuantity503: createServiceUnavailableHandler('put', `${BASKETS_URL}/packages/:packageId`),

  // Coupon errors
  couponApply500: createServerErrorHandler('post', `${ACCOUNTS_URL}/baskets/:basketIdent/coupons`),
  couponRemove500: createServerErrorHandler(
    'post',
    `${ACCOUNTS_URL}/baskets/:basketIdent/coupons/remove`,
  ),

  // Gift card errors
  giftcardApply500: createServerErrorHandler(
    'post',
    `${ACCOUNTS_URL}/baskets/:basketIdent/giftcards`,
  ),
  giftcardRemove500: createServerErrorHandler(
    'post',
    `${ACCOUNTS_URL}/baskets/:basketIdent/giftcards/remove`,
  ),

  // Creator code errors
  creatorCodeApply500: createServerErrorHandler(
    'post',
    `${ACCOUNTS_URL}/baskets/:basketIdent/creator-codes`,
  ),
  creatorCodeRemove500: createServerErrorHandler(
    'post',
    `${ACCOUNTS_URL}/baskets/:basketIdent/creator-codes/remove`,
  ),
};

/**
 * Handler that returns webstore with logo
 */
export const webstoreWithLogoHandler = http.get(ACCOUNTS_URL, () => {
  return HttpResponse.json({ data: mockWebstoreWithLogo });
});
