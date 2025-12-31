import { http, HttpResponse } from 'msw';

const BASE_URL = 'https://headless.tebex.io/api';

// Wildcard for webstore identifier (public key)
const ACCOUNTS_URL = `${BASE_URL}/accounts/:webstoreId`;
const BASKETS_URL = `${BASE_URL}/baskets/:basketIdent`;

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

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        username: username ?? null,
        ident: `basket-${Date.now()}`,
      },
    });
  }),

  // GET /api/accounts/:webstoreId/baskets/:basketIdent - Get basket
  http.get(`${ACCOUNTS_URL}/baskets/:basketIdent`, ({ params }) => {
    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/coupons - Apply coupon
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/coupons`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const couponCode = body.coupon_code as string;

    if (couponCode === 'INVALID') {
      return HttpResponse.json({ error: 'Invalid coupon' }, { status: 400 });
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
        coupons: [{ code: couponCode, discount: 10 }],
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/coupons/remove - Remove coupon
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/coupons/remove`, ({ params }) => {
    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
        coupons: [],
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/giftcards - Apply giftcard
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/giftcards`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const cardNumber = body.card_number as string;

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
        giftcards: [{ card_number: cardNumber, balance: 25 }],
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/giftcards/remove - Remove giftcard
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/giftcards/remove`, ({ params }) => {
    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
        giftcards: [],
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/creator-codes - Apply creator code
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/creator-codes`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const creatorCode = body.creator_code as string;

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
        creator_code: creatorCode,
      },
    });
  }),

  // POST /api/accounts/:webstoreId/baskets/:basketIdent/creator-codes/remove - Remove creator code
  http.post(`${ACCOUNTS_URL}/baskets/:basketIdent/creator-codes/remove`, ({ params }) => {
    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
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

    // Find the package
    let foundPkg = null;
    for (const category of mockData.categories) {
      const pkg = category.packages.find(p => p.id === packageId);
      if (pkg !== undefined) {
        foundPkg = pkg;
        break;
      }
    }

    if (foundPkg === null) {
      return HttpResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
        packages: [
          {
            ...foundPkg,
            in_basket: {
              quantity,
              price: foundPkg.base_price * quantity,
              gift_username: null,
            },
          },
        ],
        total_price: foundPkg.base_price * quantity,
      },
    });
  }),

  // POST /api/baskets/:basketIdent/packages/remove - Remove package
  http.post(`${BASKETS_URL}/packages/remove`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    // package_id is in body

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
        packages: [],
        total_price: 0,
      },
    });
  }),

  // PUT /api/baskets/:basketIdent/packages/:packageId - Update quantity
  http.put(`${BASKETS_URL}/packages/:packageId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const quantity = body.quantity as number;
    const packageId = Number(params.packageId);

    // Find the package
    let foundPkg = null;
    for (const category of mockData.categories) {
      const pkg = category.packages.find(p => p.id === packageId);
      if (pkg !== undefined) {
        foundPkg = pkg;
        break;
      }
    }

    if (foundPkg === null) {
      return HttpResponse.json({
        data: {
          ...mockData.basket,
          ident: params.basketIdent,
        },
      });
    }

    return HttpResponse.json({
      data: {
        ...mockData.basket,
        ident: params.basketIdent,
        packages: [
          {
            ...foundPkg,
            in_basket: {
              quantity,
              price: foundPkg.base_price * quantity,
              gift_username: null,
            },
          },
        ],
        total_price: foundPkg.base_price * quantity,
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
