import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useWebstore } from '../../src/hooks/useWebstore';
import { createWrapper } from '../utils/test-utils';

describe('useWebstore', () => {
  it('should fetch webstore info successfully', async () => {
    const { result } = renderHook(() => useWebstore(), {
      wrapper: createWrapper(),
    });

    // Initial loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.webstore).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data
    expect(result.current.webstore).not.toBeNull();
    expect(result.current.name).toBe('Test Store');
    expect(result.current.currency).toBe('EUR');
    expect(result.current.domain).toBe('test.tebex.io');
    expect(result.current.error).toBeNull();
  });

  it('should provide shorthand accessors', async () => {
    const { result } = renderHook(() => useWebstore(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.name).toBe(result.current.webstore?.name);
    expect(result.current.currency).toBe(result.current.webstore?.currency);
    expect(result.current.domain).toBe(result.current.webstore?.domain);
  });
});
