import { TebexHeadless } from 'tebex_headless';

let tebex: TebexHeadless | null = null;

const getTebex = async (): Promise<TebexHeadless> => {
  if (!tebex) {
    const publicKey = process.env.NEXT_PUBLIC_TEBEX_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('Missing NEXT_PUBLIC_TEBEX_PUBLIC_KEY env variable');
    }

    tebex = new TebexHeadless(publicKey);
  }
  return tebex;
};

export default getTebex;
