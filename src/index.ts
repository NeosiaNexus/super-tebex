export { TebexProvider, useTebexConfig, useTebexContext } from './provider';

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

export { useBasketStore, useUserStore, type BasketStore, type UserStore } from './stores';

export { tebexKeys, type TebexQueryKey } from './queries';

export { TebexError, TebexErrorCode } from './errors';

export type {
  AddPackageParams,
  BaseMutationReturn,
  BaseQueryReturn,
  Basket,
  BasketPackage,
  Category,
  Code,
  GiftCardCode,
  GiftPackageParams,
  Package,
  PackageType,
  ResolvedTebexConfig,
  Result,
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

export {
  err,
  isDefined,
  isError,
  isNonEmptyString,
  isPositiveInteger,
  isPositiveNumber,
  isSuccess,
  isTebexError,
  isValidMinecraftUsername,
  ok,
} from './types';

export { getTebexClient, isTebexClientInitialized } from './services';
