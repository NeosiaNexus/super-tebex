import type { GetShopUrlsResult } from '../hook/useCreateBasket';

export let shopUrls: GetShopUrlsResult | null = null;

const initShopUrls = (baseUrl: string, paths?: { complete?: string; cancel?: string }): void => {
  const completePath = paths?.complete ?? '/shop/complete-purchase';
  const cancelPath = paths?.cancel ?? '/shop/cancel-purchase';

  shopUrls = {
    completeUrl: new URL(completePath, baseUrl).toString(),
    cancelUrl: new URL(cancelPath, baseUrl).toString(),
  };
};

export default initShopUrls;
