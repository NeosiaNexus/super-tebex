import type {
  Basket,
  BasketPackage,
  Category,
  Code,
  GiftCardCode,
  Package,
  PackageType,
} from 'tebex_headless';
import type { TebexError } from '../errors/TebexError';
import type { TebexErrorCode } from '../errors/codes';

/**
 * Base return type for all query hooks.
 */
export interface BaseQueryReturn<T> {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly error: TebexError | null;
  readonly errorCode: TebexErrorCode | null;
  readonly refetch: () => Promise<unknown>;
}

/**
 * Base return type for mutation operations.
 */
export interface BaseMutationReturn {
  readonly isPending: boolean;
  readonly error: TebexError | null;
  readonly errorCode: TebexErrorCode | null;
}

// ============ Categories ============

export interface UseCategoriesOptions {
  readonly includePackages?: boolean | undefined;
  readonly enabled?: boolean | undefined;
}

export interface UseCategoriesReturn extends BaseQueryReturn<Category[]> {
  readonly categories: Category[] | null;
  readonly getByName: (name: string) => Category | undefined;
  readonly getById: (id: number) => Category | undefined;
}

// ============ Category ============

export interface UseCategoryOptions {
  readonly id: number;
  readonly enabled?: boolean | undefined;
}

export interface UseCategoryReturn extends BaseQueryReturn<Category> {
  readonly category: Category | null;
}

// ============ Packages ============

export interface UsePackagesOptions {
  readonly categoryId?: number | undefined;
  readonly enabled?: boolean | undefined;
}

export interface UsePackagesReturn extends BaseQueryReturn<Package[]> {
  readonly packages: Package[] | null;
  readonly getById: (id: number) => Package | undefined;
  readonly getByName: (name: string) => Package | undefined;
}

// ============ Package ============

export interface UsePackageOptions {
  readonly id: number;
  readonly enabled?: boolean | undefined;
}

export interface UsePackageReturn extends BaseQueryReturn<Package> {
  readonly package: Package | null;
}

// ============ Basket ============

export interface AddPackageParams {
  readonly packageId: number;
  readonly quantity?: number | undefined;
  readonly type?: PackageType | undefined;
  readonly variableData?: Record<string, string> | undefined;
}

export interface UpdateQuantityParams {
  readonly packageId: number;
  readonly quantity: number;
}

export interface UseBasketReturn extends BaseQueryReturn<Basket> {
  readonly basket: Basket | null;
  readonly basketIdent: string | null;
  readonly packages: BasketPackage[];

  // Mutation states
  readonly isAddingPackage: boolean;
  readonly isRemovingPackage: boolean;
  readonly isUpdatingQuantity: boolean;

  // Actions
  readonly addPackage: (params: AddPackageParams) => Promise<void>;
  readonly removePackage: (packageId: number) => Promise<void>;
  readonly updateQuantity: (params: UpdateQuantityParams) => Promise<void>;
  readonly clearBasket: () => void;

  // Computed
  readonly itemCount: number;
  readonly total: number;
  readonly isEmpty: boolean;
}

// ============ Checkout ============

export interface UseCheckoutOptions {
  readonly onSuccess?: (() => void) | undefined;
  readonly onError?: ((error: TebexError) => void) | undefined;
  readonly onClose?: (() => void) | undefined;
}

export interface UseCheckoutReturn {
  readonly launch: () => Promise<void>;
  readonly isLaunching: boolean;
  readonly error: TebexError | null;
  readonly errorCode: TebexErrorCode | null;
  readonly canCheckout: boolean;
  readonly checkoutUrl: string | null;
}

// ============ Coupons ============

export interface UseCouponsReturn {
  readonly coupons: Code[];
  readonly apply: (couponCode: string) => Promise<void>;
  readonly remove: (couponCode: string) => Promise<void>;
  readonly isApplying: boolean;
  readonly isRemoving: boolean;
  readonly error: TebexError | null;
  readonly errorCode: TebexErrorCode | null;
}

// ============ Gift Cards ============

export interface UseGiftCardsReturn {
  readonly giftCards: GiftCardCode[];
  readonly apply: (cardNumber: string) => Promise<void>;
  readonly remove: (cardNumber: string) => Promise<void>;
  readonly isApplying: boolean;
  readonly isRemoving: boolean;
  readonly error: TebexError | null;
  readonly errorCode: TebexErrorCode | null;
}

// ============ Creator Codes ============

export interface UseCreatorCodesReturn {
  readonly creatorCode: string | null;
  readonly apply: (code: string) => Promise<void>;
  readonly remove: () => Promise<void>;
  readonly isApplying: boolean;
  readonly isRemoving: boolean;
  readonly error: TebexError | null;
  readonly errorCode: TebexErrorCode | null;
}

// ============ Webstore ============

export interface WebstoreData {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly currency: string;
  readonly domain: string;
  readonly logo: string | null;
}

export interface UseWebstoreReturn extends BaseQueryReturn<WebstoreData> {
  readonly webstore: WebstoreData | null;
  readonly name: string | null;
  readonly currency: string | null;
  readonly domain: string | null;
}

// ============ User ============

export interface UseUserReturn {
  readonly username: string | null;
  readonly setUsername: (username: string) => void;
  readonly clearUsername: () => void;
  readonly isAuthenticated: boolean;
}

// ============ Gift Package ============

export interface GiftPackageParams {
  readonly packageId: number;
  readonly targetUsername: string;
  readonly quantity?: number | undefined;
}

export interface UseGiftPackageReturn {
  readonly gift: (params: GiftPackageParams) => Promise<void>;
  readonly isGifting: boolean;
  readonly error: TebexError | null;
  readonly errorCode: TebexErrorCode | null;
}
