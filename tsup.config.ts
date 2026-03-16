import { defineConfig } from 'tsup';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const USE_CLIENT_DIRECTIVE = "'use client';\n";

function injectUseClient(files: string[]): void {
  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      if (!content.startsWith("'use client'")) {
        writeFileSync(filePath, USE_CLIENT_DIRECTIVE + content);
      }
    } catch {
      // File may not exist for some formats
    }
  }
}

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    dts: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    minify: true,
    external: [
      'react',
      'react-dom',
      'next',
      'zustand',
      'zustand/middleware',
      'tebex_headless',
      '@tanstack/react-query',
    ],
    onSuccess: () => {
      // Generate type declarations with tsc
      execFileSync('tsc', ['--emitDeclarationOnly'], { stdio: 'inherit' });
      // Inject 'use client' directive
      injectUseClient([
        'dist/index.js',
        'dist/index.cjs',
      ]);
    },
  },
  {
    entry: { index: 'src/testing/index.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist/testing',
    dts: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    splitting: false,
    minify: true,
    external: [
      'react',
      'react-dom',
      'next',
      'zustand',
      'zustand/middleware',
      'tebex_headless',
      '@tanstack/react-query',
    ],
    onSuccess: () => {
      injectUseClient([
        'dist/testing/index.js',
        'dist/testing/index.cjs',
      ]);
    },
  },
]);
