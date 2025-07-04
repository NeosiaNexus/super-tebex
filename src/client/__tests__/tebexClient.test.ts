import { TebexHeadless } from 'tebex_headless';
import { vi } from 'vitest';
import getTebex from '../tebexClient';

vi.mock('tebex_headless', () => ({
  TebexHeadless: vi.fn().mockImplementation(key => ({ _key: key })),
}));

describe('getTebex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset le singleton
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_TEBEX_PUBLIC_KEY;
  });

  it('should throw if NEXT_PUBLIC_TEBEX_PUBLIC_KEY is missing', async () => {
    await expect(getTebex()).rejects.toThrow('Missing NEXT_PUBLIC_TEBEX_PUBLIC_KEY env variable');
  });

  it('should return the same instance on subsequent calls', async () => {
    process.env.NEXT_PUBLIC_TEBEX_PUBLIC_KEY = 'public-key';
    const first = await getTebex();
    const second = await getTebex();

    expect(first).toBe(second);
    expect(TebexHeadless).toHaveBeenCalledTimes(1);
  });
});
