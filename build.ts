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

await Promise.all([
  // Main entry - ESM
  Bun.build({
    ...mainBuildConfig,
    plugins: [dts()],
    format: 'esm',
    naming: '[dir]/[name].js',
    minify: true,
  }),
  // Main entry - CJS
  Bun.build({
    ...mainBuildConfig,
    format: 'cjs',
    naming: '[dir]/[name].cjs',
    minify: true,
  }),
  // Testing entry - ESM
  Bun.build({
    ...testingBuildConfig,
    plugins: [dts()],
    format: 'esm',
    naming: '[dir]/[name].js',
    minify: true,
  }),
  // Testing entry - CJS
  Bun.build({
    ...testingBuildConfig,
    format: 'cjs',
    naming: '[dir]/[name].cjs',
    minify: true,
  }),
]);
