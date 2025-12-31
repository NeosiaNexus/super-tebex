import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TebexErrorCode } from '../../src/errors/codes';
import { TebexProvider, useTebexConfig, useTebexContext } from '../../src/provider/TebexProvider';
import type { TebexConfig } from '../../src/types/config';
import { createWrapper, testConfig } from '../utils/test-utils';

describe('TebexProvider', () => {
  it('should provide context to children', () => {
    const { result } = renderHook(() => useTebexContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.config.publicKey).toBe('test-public-key');
    expect(result.current.config.baseUrl).toBe('https://test.example.com');
    expect(result.current.queryClient).toBeDefined();
  });

  it('should throw error when useTebexContext is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTebexContext());
    }).toThrow('useTebexContext must be used within TebexProvider');

    consoleSpy.mockRestore();
  });

  it('should resolve URLs correctly', () => {
    const { result } = renderHook(() => useTebexConfig(), {
      wrapper: createWrapper(),
    });

    expect(result.current.completeUrl).toBe('https://test.example.com/shop/complete');
    expect(result.current.cancelUrl).toBe('https://test.example.com/shop/cancel');
  });

  it('should remove trailing slash from baseUrl', () => {
    const configWithSlash: TebexConfig = {
      publicKey: 'test-key',
      baseUrl: 'https://example.com/',
    };

    const { result } = renderHook(() => useTebexConfig(), {
      wrapper: createWrapper(configWithSlash),
    });

    expect(result.current.baseUrl).toBe('https://example.com');
    expect(result.current.completeUrl).toBe('https://example.com/shop/complete');
  });

  it('should use custom URLs when provided', () => {
    const customConfig: TebexConfig = {
      publicKey: 'test-key',
      baseUrl: 'https://example.com',
      urls: {
        complete: '/custom/complete',
        cancel: '/custom/cancel',
      },
    };

    const { result } = renderHook(() => useTebexConfig(), {
      wrapper: createWrapper(customConfig),
    });

    expect(result.current.completeUrl).toBe('https://example.com/custom/complete');
    expect(result.current.cancelUrl).toBe('https://example.com/custom/cancel');
  });

  it('should render children', () => {
    render(
      <TebexProvider config={testConfig}>
        <div data-testid="child">Child content</div>
      </TebexProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should enable devtools in development', () => {
    const configWithDevtools: TebexConfig = {
      publicKey: 'test-key',
      baseUrl: 'https://example.com',
      devtools: true,
    };

    const { result } = renderHook(() => useTebexConfig(), {
      wrapper: createWrapper(configWithDevtools),
    });

    expect(result.current.devtools).toBe(true);
  });

  it('should disable devtools when explicitly set to false', () => {
    const configWithoutDevtools: TebexConfig = {
      publicKey: 'test-key',
      baseUrl: 'https://example.com',
      devtools: false,
    };

    const { result } = renderHook(() => useTebexConfig(), {
      wrapper: createWrapper(configWithoutDevtools),
    });

    expect(result.current.devtools).toBe(false);
  });

  it('should accept onError callback', () => {
    const onError = vi.fn();
    const configWithOnError: TebexConfig = {
      publicKey: 'test-key',
      baseUrl: 'https://example.com',
      onError,
    };

    const { result } = renderHook(() => useTebexConfig(), {
      wrapper: createWrapper(configWithOnError),
    });

    expect(result.current.onError).toBe(onError);
  });

  it('should provide useTebexConfig hook', () => {
    const { result } = renderHook(() => useTebexConfig(), {
      wrapper: createWrapper(),
    });

    expect(result.current.publicKey).toBe('test-public-key');
    expect(result.current.baseUrl).toBe('https://test.example.com');
  });

  it('should throw TebexError with PROVIDER_NOT_FOUND code when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderHook(() => useTebexContext());
    } catch (error) {
      expect(error).toHaveProperty('code', TebexErrorCode.PROVIDER_NOT_FOUND);
    }

    consoleSpy.mockRestore();
  });

  it('should use external QueryClient when provided', () => {
    const { QueryClient } = require('@tanstack/react-query');
    const externalQueryClient = new QueryClient();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TebexProvider config={testConfig} queryClient={externalQueryClient}>
        {children}
      </TebexProvider>
    );

    const { result } = renderHook(() => useTebexContext(), { wrapper });

    expect(result.current.queryClient).toBe(externalQueryClient);
  });
});
