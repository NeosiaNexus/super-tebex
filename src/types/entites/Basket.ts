import { BasketLinks, BasketPackage, Coupon, GiftCard } from "./index";

interface Basket {
  id: number;
  ident: string;
  complete: boolean;
  email: string | null;
  username: string;
  coupons: Coupon[];
  giftcards: GiftCard[];
  creator_code: string;
  cancel_url: string | null;
  complete_url: string | null;
  complete_auto_redirect: boolean;
  country: string;
  ip: string;
  username_id: string;
  base_price: number;
  sales_tax: number;
  total_price: number;
  currency: string;
  packages: BasketPackage[];
  links: BasketLinks;
}

export default Basket;
