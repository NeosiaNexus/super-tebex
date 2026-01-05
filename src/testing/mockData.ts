import type { Basket, BasketPackage, Category, Code, GiftCardCode, Package } from 'tebex_headless';

import type { WebstoreData } from '../types/hooks';

/**
 * Mock webstore data for testing.
 */
export interface MockWebstoreData extends WebstoreData {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly currency: string;
  readonly domain: string;
  readonly logo: string | null;
}

/**
 * Mock package data for testing.
 * Extends the base Package type with required fields.
 */
export type MockPackage = Package;

/**
 * Mock category data for testing.
 */
export type MockCategory = Category;

/**
 * Mock basket data for testing.
 */
export type MockBasket = Basket;

/**
 * Configuration for mock data.
 */
export interface MockDataConfig {
  readonly webstore?: Partial<MockWebstoreData> | undefined;
  readonly categories?: MockCategory[] | undefined;
  readonly packages?: MockPackage[] | undefined;
  readonly basket?: Partial<MockBasket> | undefined;
  readonly username?: string | null | undefined;
}

/**
 * Default mock webstore data.
 */
export const defaultMockWebstore: MockWebstoreData = {
  id: 1,
  name: 'Test Store',
  description: 'A test Tebex store for development',
  currency: 'EUR',
  domain: 'test.tebex.io',
  logo: null,
};

/**
 * Default mock packages organized by category.
 */
export const defaultMockPackages: MockPackage[] = [
  {
    id: 101,
    name: 'VIP Gold',
    description: 'Gold VIP membership with exclusive perks',
    type: 'single',
    disable_gifting: false,
    disable_quantity: false,
    expiration_date: null,
    base_price: 9.99,
    sales_tax: 0,
    total_price: 9.99,
    currency: 'EUR',
    image: null,
    category: { id: 1, name: 'VIP Ranks' },
    discount: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    order: 1,
  },
  {
    id: 102,
    name: 'VIP Diamond',
    description: 'Diamond VIP membership with all perks',
    type: 'single',
    disable_gifting: false,
    disable_quantity: false,
    expiration_date: null,
    base_price: 19.99,
    sales_tax: 0,
    total_price: 19.99,
    currency: 'EUR',
    image: null,
    category: { id: 1, name: 'VIP Ranks' },
    discount: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    order: 2,
  },
  {
    id: 201,
    name: 'Pet Pack',
    description: 'Adorable pet companions',
    type: 'single',
    disable_gifting: false,
    disable_quantity: false,
    expiration_date: null,
    base_price: 4.99,
    sales_tax: 0,
    total_price: 4.99,
    currency: 'EUR',
    image: null,
    category: { id: 2, name: 'Cosmetics' },
    discount: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    order: 1,
  },
  {
    id: 202,
    name: 'Trail Effects',
    description: 'Particle trail effects',
    type: 'single',
    disable_gifting: false,
    disable_quantity: false,
    expiration_date: null,
    base_price: 2.99,
    sales_tax: 0,
    total_price: 2.99,
    currency: 'EUR',
    image: null,
    category: { id: 2, name: 'Cosmetics' },
    discount: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    order: 2,
  },
  {
    id: 301,
    name: '1000 Coins',
    description: 'In-game currency pack',
    type: 'single',
    disable_gifting: false,
    disable_quantity: false,
    expiration_date: null,
    base_price: 1.99,
    sales_tax: 0,
    total_price: 1.99,
    currency: 'EUR',
    image: null,
    category: { id: 3, name: 'Currency' },
    discount: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    order: 1,
  },
];

/**
 * Default mock categories with packages.
 */
export const defaultMockCategories: MockCategory[] = [
  {
    id: 1,
    name: 'VIP Ranks',
    description: 'Exclusive VIP memberships',
    parent: null,
    order: 1,
    display_type: 'grid',
    slug: 'vip-ranks',
    packages: defaultMockPackages.filter(p => p.category.id === 1),
  },
  {
    id: 2,
    name: 'Cosmetics',
    description: 'Cosmetic items and effects',
    parent: null,
    order: 2,
    display_type: 'grid',
    slug: 'cosmetics',
    packages: defaultMockPackages.filter(p => p.category.id === 2),
  },
  {
    id: 3,
    name: 'Currency',
    description: 'In-game currency packs',
    parent: null,
    order: 3,
    display_type: 'grid',
    slug: 'currency',
    packages: defaultMockPackages.filter(p => p.category.id === 3),
  },
];

/**
 * Default empty basket.
 */
export const defaultMockBasket: MockBasket = {
  ident: 'mock-basket-001',
  complete: false,
  id: 1,
  country: 'US',
  ip: '127.0.0.1',
  username_id: null,
  username: null,
  cancel_url: 'https://example.com/cancel',
  complete_url: 'https://example.com/complete',
  complete_auto_redirect: false,
  base_price: 0,
  sales_tax: 0,
  total_price: 0,
  email: '',
  currency: 'EUR',
  packages: [],
  coupons: [],
  giftcards: [],
  creator_code: '',
  links: {
    checkout: 'https://checkout.tebex.io/mock',
  },
  custom: {},
};

/**
 * Create a basket package from a mock package.
 */
export function createBasketPackage(
  pkg: MockPackage,
  quantity = 1,
  giftUsername: string | null = null,
): BasketPackage {
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    image: pkg.image,
    in_basket: {
      quantity,
      price: pkg.base_price * quantity,
      gift_username_id: null,
      gift_username: giftUsername,
    },
  };
}

/**
 * Create a mock basket with items.
 */
export function createMockBasket(
  items: { package: MockPackage; quantity?: number; giftUsername?: string | null }[],
  overrides?: Partial<MockBasket>,
): MockBasket {
  const packages = items.map(item =>
    createBasketPackage(item.package, item.quantity ?? 1, item.giftUsername ?? null),
  );

  const totalPrice = packages.reduce((sum, pkg) => sum + pkg.in_basket.price, 0);

  return {
    ...defaultMockBasket,
    packages,
    total_price: totalPrice,
    base_price: totalPrice,
    ...overrides,
  };
}

/**
 * Create a mock coupon.
 */
export function createMockCoupon(code: string): Code {
  return {
    code,
  };
}

/**
 * Create a mock gift card.
 */
export function createMockGiftCard(cardNumber: string): GiftCardCode {
  return {
    card_number: cardNumber,
  };
}

/**
 * Pre-built mock data for common testing scenarios.
 */
export const mockData = {
  /** Default webstore */
  webstore: defaultMockWebstore,

  /** All categories with packages */
  categories: defaultMockCategories,

  /** All packages flat list */
  packages: defaultMockPackages,

  /** Empty basket */
  emptyBasket: defaultMockBasket,

  /** Basket with one VIP Gold item */
  basketWithOneItem: createMockBasket([{ package: defaultMockPackages[0] as MockPackage, quantity: 1 }]),

  /** Basket with multiple items */
  basketWithMultipleItems: createMockBasket([
    { package: defaultMockPackages[0] as MockPackage, quantity: 1 },
    { package: defaultMockPackages[2] as MockPackage, quantity: 2 },
  ]),

  /** Basket with coupon applied */
  basketWithCoupon: {
    ...createMockBasket([{ package: defaultMockPackages[0] as MockPackage, quantity: 1 }]),
    coupons: [createMockCoupon('SAVE10')],
  },

  /** Basket with gift card applied */
  basketWithGiftCard: {
    ...createMockBasket([{ package: defaultMockPackages[0] as MockPackage, quantity: 1 }]),
    giftcards: [createMockGiftCard('GIFT-1234-5678')],
  },

  /** Basket with creator code */
  basketWithCreatorCode: {
    ...createMockBasket([{ package: defaultMockPackages[0] as MockPackage, quantity: 1 }]),
    creator_code: 'STREAMER123',
  },

  /** Helper functions */
  helpers: {
    createBasketPackage,
    createMockBasket,
    createMockCoupon,
    createMockGiftCard,
  },

  /** Get package by ID */
  getPackageById: (id: number): MockPackage | undefined => {
    return defaultMockPackages.find(p => p.id === id);
  },

  /** Get category by ID */
  getCategoryById: (id: number): MockCategory | undefined => {
    return defaultMockCategories.find(c => c.id === id);
  },
} as const;

export type { Basket, BasketPackage, Category, Code, GiftCardCode, Package };
