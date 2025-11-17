import { TebexHeadless } from 'tebex_headless';
import { tebex } from './initTebex';

const getTebex = (): TebexHeadless => {
  if (!tebex) {
    throw new Error('Tebex client not initialized. Call initTebex(publicKey) first.');
  }
  return tebex;
};

export default getTebex;
