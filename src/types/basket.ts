interface CreateBasketProps {
  username: string;
  completeUrl: string;
  cancelUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom?: Record<string, any>;
  completeAutoRedirect?: boolean;
  ipAddress?: string;
}

interface ShopBasketStore {
  basketIdent: string | null;
  setBasketIdent: (basketIdent: string) => void;
  clearBasketIdent: () => void;
}

export type { CreateBasketProps, ShopBasketStore };
