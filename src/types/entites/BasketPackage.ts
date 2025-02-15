import { InBasketInformations } from "./index";

interface BasketPackage {
  id: number;
  name: string;
  description: string;
  in_basket: InBasketInformations;
  image: string | null;
}

export default BasketPackage;
