import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBasket } from '../../src/hooks/useBasket';
import { useCreatorCodes } from '../../src/hooks/useCreatorCodes';
import { useUser } from '../../src/hooks/useUser';
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
  });
});
