import '@testing-library/jest-dom/vitest';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useBasketStore } from '../src/stores/basketStore';
import { useUserStore } from '../src/stores/userStore';
import { handlers, resetMockState } from './mocks/handlers';

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers, mock state, and Zustand stores after each test
afterEach(() => {
  server.resetHandlers();
  resetMockState();
  // Reset Zustand stores to initial state
  useBasketStore.setState({ basketIdent: null });
  useUserStore.setState({ username: null });
});

// Close server after all tests
afterAll(() => {
  server.close();
});
