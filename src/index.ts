// Provider
export { TebexProvider, useTebexConfig, useTebexContext } from './provider';

// Hooks
export {
  useBasket,
  useCategories,
  useCategory,
  useCheckout,
  useCoupons,
  useCreatorCodes,
  useGiftCards,
  useGiftPackage,
  usePackage,
  usePackages,
  useUser,
  useWebstore,
} from './hooks';

// Stores
export { useBasketStore, useUserStore, type BasketStore, type UserStore } from './stores';

// Queries
export { tebexKeys } from './queries';

// Errors
export { TebexError, TebexErrorCode } from './errors';

// Types
export type {
  AddPackageParams,
  BaseMutationReturn,
  // Hook returns
  BaseQueryReturn,
  // Tebex types
  Basket,
  BasketPackage,
  Category,
  Code,
  GiftCardCode,
  GiftPackageParams,
  Package,
  PackageType,
  ResolvedTebexConfig,
  // Result
  Result,
  // Config
  TebexConfig,
  TebexUrls,
  UpdateQuantityParams,
  UseBasketReturn,
  UseCategoriesOptions,
  UseCategoriesReturn,
  UseCategoryOptions,
  UseCategoryReturn,
  UseCheckoutOptions,
  UseCheckoutReturn,
  UseCouponsReturn,
  UseCreatorCodesReturn,
  UseGiftCardsReturn,
  UseGiftPackageReturn,
  UsePackageOptions,
  UsePackageReturn,
  UsePackagesOptions,
  UsePackagesReturn,
  UseUserReturn,
  UseWebstoreReturn,
  Webstore,
  WebstoreData,
} from './types';

// Type utilities
export { err, isDefined, isError, isSuccess, isTebexError, ok } from './types';

// Services (for advanced usage)
export { getTebexClient, isTebexClientInitialized } from './services';
