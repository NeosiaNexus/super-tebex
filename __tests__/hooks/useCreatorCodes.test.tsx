import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useCreatorCodes } from '../../src/hooks/useCreatorCodes';
import { useUser } from '../../src/hooks/useUser';
import { TebexErrorCode } from '../../src/errors/codes';
import { createWrapper } from '../utils/test-utils';

describe('useCreatorCodes', () => {
  it('should start with no creator code', () => {
    const { result } = renderHook(() => useCreatorCodes(), {
      wrapper: createWrapper(),
    });

    expect(result.current.creatorCode).toBeNull();
    expect(result.current.isApplying).toBe(false);
    expect(result.current.isRemoving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });

  it('should throw error when applying creator code without basket', async () => {
    const { result } = renderHook(() => useCreatorCodes(), {
      wrapper: createWrapper(),
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.apply('CREATOR123');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as any).code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should throw error when removing creator code without basket', async () => {
    const { result } = renderHook(() => useCreatorCodes(), {
      wrapper: createWrapper(),
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.remove();
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    expect((thrownError as any).code).toBe(TebexErrorCode.BASKET_NOT_FOUND);
  });

  it('should apply creator code when basket exists', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Now test creator codes
    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    await act(async () => {
      await creatorCodesResult.current.apply('CREATOR123');
    });

    expect(creatorCodesResult.current.isApplying).toBe(false);
    expect(creatorCodesResult.current.error).toBeNull();
  });

  it('should remove creator code when basket exists', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    // Now test creator codes
    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Apply then remove
    await act(async () => {
      await creatorCodesResult.current.apply('CREATOR123');
    });

    await act(async () => {
      await creatorCodesResult.current.remove();
    });

    expect(creatorCodesResult.current.isRemoving).toBe(false);
    expect(creatorCodesResult.current.error).toBeNull();
  });

  it('should track applying state during apply mutation', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Initial state
    expect(creatorCodesResult.current.isApplying).toBe(false);

    // Apply creator code
    await act(async () => {
      await creatorCodesResult.current.apply('CREATOR123');
    });

    // After completion
    expect(creatorCodesResult.current.isApplying).toBe(false);
  });

  it('should track removing state during remove mutation', async () => {
    const wrapper = createWrapper();

    // Set up user and basket
    const { result: userResult } = renderHook(() => useUser(), { wrapper });
    await act(async () => {
      userResult.current.setUsername('TestPlayer');
    });

    const { result: basketResult } = renderHook(() => useBasket(), { wrapper });
    await act(async () => {
      await basketResult.current.addPackage({ packageId: 101 });
    });

    await waitFor(() => {
      expect(basketResult.current.basketIdent).not.toBeNull();
    });

    const { result: creatorCodesResult } = renderHook(() => useCreatorCodes(), { wrapper });

    // Initial state
    expect(creatorCodesResult.current.isRemoving).toBe(false);

    // Remove creator code
    await act(async () => {
      await creatorCodesResult.current.remove();
    });

    // After completion
    expect(creatorCodesResult.current.isRemoving).toBe(false);
  });
});
