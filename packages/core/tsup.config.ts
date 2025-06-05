import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'db/index': 'db/index.ts',
    'db/schema': 'db/schema.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    entry: {
      index: 'src/index.ts',
      'db/index': 'db/index.ts',
      'db/schema': 'db/schema.ts',
    },
    resolve: true,
  },
  splitting: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  treeshake: true,
  external: ['@neondatabase/serverless', 'drizzle-orm', 'pg', 'pgvector'],
  tsconfig: './tsconfig.json',
  skipNodeModulesBundle: true,
  noExternal: ['@stacktracker/core'],
});
