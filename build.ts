import type { BuildConfig } from 'bun';
import dts from 'bun-plugin-dts';

const external = [
  'react',
  'react-dom',
  'zustand',
  'sonner',
  'tebex_headless',
  '@tanstack/react-query',
];

const mainBuildConfig: BuildConfig = {
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  external,
  target: 'browser',
};

const testingBuildConfig: BuildConfig = {
  entrypoints: ['./src/testing/index.ts'],
  outdir: './dist/testing',
  external,
  target: 'browser',
};

// Phase 1: Build ESM with DTS generation (types only need to be generated once)
await Promise.all([
  Bun.build({
    ...mainBuildConfig,
    plugins: [dts()],
    format: 'esm',
    naming: '[dir]/[name].js',
    minify: true,
  }),
  Bun.build({
    ...testingBuildConfig,
    plugins: [dts()],
    format: 'esm',
    naming: '[dir]/[name].js',
    minify: true,
  }),
]);

// Phase 2: Build CJS (no DTS needed - reuses existing .d.ts files)
await Promise.all([
  Bun.build({
    ...mainBuildConfig,
    format: 'cjs',
    naming: '[dir]/[name].cjs',
    minify: true,
  }),
  Bun.build({
    ...testingBuildConfig,
    format: 'cjs',
    naming: '[dir]/[name].cjs',
    minify: true,
  }),
]);
