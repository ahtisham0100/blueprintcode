import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // Everything under test so far is server-side (proxy, route handlers,
    // lib). Switch individual files to jsdom with a `// @vitest-environment`
    // comment when a component test needs it.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
