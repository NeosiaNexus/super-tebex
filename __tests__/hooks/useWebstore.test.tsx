import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useWebstore } from '../../src/hooks/useWebstore';
import { errorHandlers, webstoreWithLogoHandler } from '../mocks/handlers';
import { server } from '../setup';
import { createWrapper, TebexErrorCode } from '../utils/test-utils';

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

  // ============================================================================
  // NEW TESTS: Logo and error handling
  // ============================================================================

  it('should include logo when webstore has a logo URL', async () => {
    // Override handler to return webstore with logo
    server.use(webstoreWithLogoHandler);

    const { result } = renderHook(() => useWebstore(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify logo is included in webstore data
    expect(result.current.webstore?.logo).not.toBeNull();
    expect(result.current.webstore?.logo).toBe('https://cdn.tebex.io/stores/test/logo.png');
  });

  it('should return null logo when webstore has empty logo', async () => {
    const { result } = renderHook(() => useWebstore(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Default mock has empty logo, which gets transformed to null
    expect(result.current.webstore?.logo).toBeNull();
  });

  it('should handle fetch error and provide error code', async () => {
    // Override handler to return error
    server.use(errorHandlers.webstore500);

    const { result } = renderHook(() => useWebstore(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify error is populated
    expect(result.current.error).not.toBeNull();
    expect(result.current.errorCode).toBe(TebexErrorCode.UNKNOWN);
    expect(result.current.webstore).toBeNull();
  });

  it('should have refetch function', async () => {
    const { result } = renderHook(() => useWebstore(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify refetch is available
    expect(typeof result.current.refetch).toBe('function');
  });
});
