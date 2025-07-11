import type { BuildConfig } from 'bun';
import dts from 'bun-plugin-dts';

const defaultBuildConfig: BuildConfig = {
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  external: ['react', 'react-dom', 'zustand', 'sonner', 'tebex_headless'],
  target: 'browser',
};

await Promise.all([
  Bun.build({
    ...defaultBuildConfig,
    plugins: [dts()],
    format: 'esm',
    naming: '[dir]/[name].js',
    minify: true,
  }),
  Bun.build({
    ...defaultBuildConfig,
    format: 'cjs',
    naming: '[dir]/[name].cjs',
    minify: true,
  }),
]);
