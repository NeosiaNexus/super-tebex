import { TebexHeadless } from 'tebex_headless';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('tebex_headless', () => ({
  TebexHeadless: vi.fn().mockImplementation((key: string) => ({ _key: key })),
}));

describe('initTebex / getTebex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should throw if getTebex is called before initTebex', async () => {
    const { default: getTebex } = await import('../tebexClient');

    expect(() => getTebex()).toThrowError(
      'Tebex client not initialized. Call initTebex(publicKey) first.',
    );
  });

  it('should create TebexHeadless once and return the same instance on subsequent calls', async () => {
    const { default: initTebex } = await import('../initTebex');
    const { default: getTebex } = await import('../tebexClient');

    initTebex('public-key');

    const first = getTebex();
    const second = getTebex();

    expect(first).toBe(second);

    const TebexHeadlessMock = TebexHeadless as unknown as Mock;

    expect(TebexHeadlessMock).toHaveBeenCalledTimes(1);
    expect(TebexHeadlessMock).toHaveBeenCalledWith('public-key');
  });
});
