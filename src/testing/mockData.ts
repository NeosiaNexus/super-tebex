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
export interface MockPackage extends Package {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly type: 'single' | 'subscription' | 'both';
  readonly base_price: number;
  readonly sales_price: number;
  readonly total_price: number;
  readonly currency: string;
  readonly image: string | null;
  readonly category: { id: number; name: string };
  readonly discount: number;
}

/**
 * Mock category data for testing.
 */
export interface MockCategory extends Category {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly packages: MockPackage[];
}

/**
 * Mock basket data for testing.
 */
export interface MockBasket extends Basket {
  readonly ident: string;
  readonly complete: boolean;
  readonly id: number;
  readonly country: string;
  readonly ip: string;
  readonly username: string | null;
  readonly base_price: { amount: number; currency: string };
  readonly sales_tax: { amount: number; currency: string };
  readonly total_price: number;
  readonly packages: BasketPackage[];
  readonly coupons: Code[];
  readonly giftcards: GiftCardCode[];
  readonly creator_code: string | null;
  readonly links: { checkout: string };
}

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
    base_price: 9.99,
    sales_price: 9.99,
    total_price: 9.99,
    currency: 'EUR',
    image: null,
    category: { id: 1, name: 'VIP Ranks' },
    discount: 0,
    gift_username_required: false,
  },
  {
    id: 102,
    name: 'VIP Diamond',
    description: 'Diamond VIP membership with all perks',
    type: 'single',
    base_price: 19.99,
    sales_price: 19.99,
    total_price: 19.99,
    currency: 'EUR',
    image: null,
    category: { id: 1, name: 'VIP Ranks' },
    discount: 0,
    gift_username_required: false,
  },
  {
    id: 201,
    name: 'Pet Pack',
    description: 'Adorable pet companions',
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
  {
    id: 202,
    name: 'Trail Effects',
    description: 'Particle trail effects',
    type: 'single',
    base_price: 2.99,
    sales_price: 2.99,
    total_price: 2.99,
    currency: 'EUR',
    image: null,
    category: { id: 2, name: 'Cosmetics' },
    discount: 0,
    gift_username_required: false,
  },
  {
    id: 301,
    name: '1000 Coins',
    description: 'In-game currency pack',
    type: 'single',
    base_price: 1.99,
    sales_price: 1.99,
    total_price: 1.99,
    currency: 'EUR',
    image: null,
    category: { id: 3, name: 'Currency' },
    discount: 0,
    gift_username_required: false,
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
    packages: defaultMockPackages.filter(p => p.category.id === 1),
  },
  {
    id: 2,
    name: 'Cosmetics',
    description: 'Cosmetic items and effects',
    packages: defaultMockPackages.filter(p => p.category.id === 2),
  },
  {
    id: 3,
    name: 'Currency',
    description: 'In-game currency packs',
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
  username: null,
  base_price: { amount: 0, currency: 'EUR' },
  sales_tax: { amount: 0, currency: 'EUR' },
  total_price: 0,
  packages: [],
  coupons: [],
  giftcards: [],
  creator_code: null,
  links: {
    checkout: 'https://checkout.tebex.io/mock',
  },
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
    base_price: { amount: totalPrice, currency: 'EUR' },
    ...overrides,
  };
}

/**
 * Create a mock coupon.
 */
export function createMockCoupon(code: string, discount = 10): Code {
  return {
    code,
    discount,
  };
}

/**
 * Create a mock gift card.
 */
export function createMockGiftCard(cardNumber: string, balance = 25): GiftCardCode {
  return {
    card_number: cardNumber,
    balance,
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
  basketWithOneItem: createMockBasket([{ package: defaultMockPackages[0], quantity: 1 }]),

  /** Basket with multiple items */
  basketWithMultipleItems: createMockBasket([
    { package: defaultMockPackages[0], quantity: 1 },
    { package: defaultMockPackages[2], quantity: 2 },
  ]),

  /** Basket with coupon applied */
  basketWithCoupon: {
    ...createMockBasket([{ package: defaultMockPackages[0], quantity: 1 }]),
    coupons: [createMockCoupon('SAVE10', 10)],
  },

  /** Basket with gift card applied */
  basketWithGiftCard: {
    ...createMockBasket([{ package: defaultMockPackages[0], quantity: 1 }]),
    giftcards: [createMockGiftCard('GIFT-1234-5678', 25)],
  },

  /** Basket with creator code */
  basketWithCreatorCode: {
    ...createMockBasket([{ package: defaultMockPackages[0], quantity: 1 }]),
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
