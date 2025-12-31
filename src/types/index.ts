// Config types
export type { ResolvedTebexConfig, TebexConfig, TebexUrls } from './config';

// Result types
export { err, ok } from './result';
export type { Result } from './result';

// Hook return types
export type {
  // Basket
  AddPackageParams,
  BaseMutationReturn,
  // Base types
  BaseQueryReturn,
  // Gift Package
  GiftPackageParams,
  UpdateQuantityParams,
  UseBasketReturn,
  // Categories
  UseCategoriesOptions,
  UseCategoriesReturn,
  // Category
  UseCategoryOptions,
  UseCategoryReturn,
  // Checkout
  UseCheckoutOptions,
  UseCheckoutReturn,
  // Coupons
  UseCouponsReturn,
  // Creator Codes
  UseCreatorCodesReturn,
  // Gift Cards
  UseGiftCardsReturn,
  UseGiftPackageReturn,
  // Package
  UsePackageOptions,
  UsePackageReturn,
  // Packages
  UsePackagesOptions,
  UsePackagesReturn,
  // User
  UseUserReturn,
  UseWebstoreReturn,
  // Webstore
  WebstoreData,
} from './hooks';

// Type guards
export {
  isDefined,
  isError,
  isNonEmptyString,
  isPositiveNumber,
  isSuccess,
  isTebexError,
} from './guards';

// Re-export tebex_headless types
export type {
  Basket,
  BasketPackage,
  Category,
  Code,
  GiftCardCode,
  Package,
  PackageType,
  Webstore,
} from 'tebex_headless';
