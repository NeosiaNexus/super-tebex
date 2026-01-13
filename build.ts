import type { BuildConfig } from 'bun';
import dts from 'bun-plugin-dts';

// CRITICAL: This build script MUST be run with NODE_ENV=production
// See package.json "build" script for the correct invocation
//
// Why: Bun has a regression (https://github.com/oven-sh/bun/issues/23959)
// where Bun.build uses react-jsxdev (development) instead of react-jsx (production)
// The jsxDEV function doesn't exist in production React builds, causing runtime errors
//
// Setting NODE_ENV=production in the shell ensures:
// 1. Bun uses the production JSX runtime (jsx instead of jsxDEV)
// 2. process.env.NODE_ENV checks in the code are NOT replaced (preserving tree-shaking for consumers)

const external = [
  'react',
  'react-dom',
  'zustand',
  'sonner',
  'tebex_headless',
  '@tanstack/react-query',
];

const sharedConfig: Partial<BuildConfig> = {
  external,
  target: 'browser',
};

const mainBuildConfig: BuildConfig = {
  ...sharedConfig,
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
};

const testingBuildConfig: BuildConfig = {
  ...sharedConfig,
  entrypoints: ['./src/testing/index.ts'],
  outdir: './dist/testing',
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

// Phase 3: Inject 'use client' directive for Next.js App Router compatibility
// This directive is stripped during bundling but is required for client components
const USE_CLIENT_DIRECTIVE = "'use client';\n";

const filesToInject = [
  './dist/index.js',
  './dist/index.cjs',
  './dist/testing/index.js',
  './dist/testing/index.cjs',
];

await Promise.all(
  filesToInject.map(async filePath => {
    const file = Bun.file(filePath);
    if (await file.exists()) {
      const content = await file.text();
      await Bun.write(filePath, USE_CLIENT_DIRECTIVE + content);
    }
  }),
);
