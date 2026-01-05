/**
 * @neosianexus/super-tebex/testing
 *
 * Testing utilities for Tebex SDK.
 * Use TebexMockProvider for Storybook, demos, and component testing.
 *
 * @example
 * ```tsx
 * import { TebexMockProvider, mockData } from '@neosianexus/super-tebex/testing';
 *
 * // Basic usage
 * <TebexMockProvider>
 *   <YourComponent />
 * </TebexMockProvider>
 *
 * // With custom data
 * <TebexMockProvider
 *   mockData={{
 *     basket: mockData.basketWithMultipleItems,
 *     webstore: { name: 'Custom Store' },
 *   }}
 * >
 *   <YourComponent />
 * </TebexMockProvider>
 * ```
 *
 * @packageDocumentation
 */

// Provider
export {
  TebexMockProvider,
  useIsMockProvider,
  type TebexMockProviderProps,
} from './TebexMockProvider';

// Mock data and helpers
export {
  // Factory functions
  createBasketPackage,
  createMockBasket,
  createMockCoupon,
  createMockGiftCard,
  defaultMockBasket,
  defaultMockCategories,
  defaultMockPackages,
  // Default data
  defaultMockWebstore,
  // Pre-built mock data
  mockData,
  type MockBasket,
  type MockCategory,
  type MockDataConfig,
  type MockPackage,
  // Types
  type MockWebstoreData,
} from './mockData';

// Re-export commonly used types from main package
export type { Basket, BasketPackage, Category, Code, GiftCardCode, Package } from './mockData';
