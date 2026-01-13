import type { BuildConfig } from 'bun';
import dts from 'bun-plugin-dts';

const external = [
  'react',
  'react-dom',
  'zustand',
  'sonner',
  'tebex_headless',
  '@tanstack/react-query',
  '@tanstack/react-query-devtools',
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
