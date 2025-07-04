import { Basket, InBasket, Package, PackageType } from 'tebex_headless';
import { getTebex } from '../client';
import { CreateBasketProps } from '../types';

const createBasket = async ({
  username,
  completeUrl,
  cancelUrl,
  custom,
  completeAutoRedirect,
  ipAddress,
}: CreateBasketProps): Promise<Basket> => {
  const tebex = await getTebex();

  return tebex.createMinecraftBasket(
    username,
    completeUrl,
    cancelUrl,
    custom,
    completeAutoRedirect,
    ipAddress,
  );
};

const getBasket = async (basketIdent: Basket['ident']): Promise<Basket> => {
  const tebex = await getTebex();

  return tebex.getBasket(basketIdent);
};

const addPackageToBasket = async (
  basketIdent: Basket['ident'],
  packageId: Package['id'],
  quantity?: InBasket['quantity'],
  type?: PackageType,
  variableData?: Record<string, string>,
): Promise<Basket> => {
  const tebex = await getTebex();

  return tebex.addPackageToBasket(basketIdent, packageId, quantity ?? 1, type, variableData);
};

const removePackageFromBasket = async (
  basketIdent: Basket['ident'],
  packageId: Package['id'],
  currentQuantity: InBasket['quantity'],
): Promise<Basket> => {
  const tebex = await getTebex();
  return tebex.updateQuantity(
    basketIdent,
    packageId,
    currentQuantity - 1 >= 0 ? currentQuantity - 1 : 0,
  );
};

const basketService = {
  createBasket,
  getBasket,
  addPackageToBasket,
  removePackageFromBasket,
};

export default basketService;
