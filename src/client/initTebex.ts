import { TebexHeadless } from 'tebex_headless';

export let tebex: TebexHeadless | null = null;

const initTebex = (publicKey: string): void => {
  tebex = new TebexHeadless(publicKey);
};

export default initTebex;
