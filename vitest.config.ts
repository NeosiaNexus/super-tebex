import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        '**/__tests__/**',
        '**/node_modules/**',
        '**/vitest.setup.ts',
        '**/types/**',
        '**/hot-update.js',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**',
        '**/build.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
    mockReset: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
