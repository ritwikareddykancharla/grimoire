import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so Vitest's bundled Vite types never clash
// with the app's Vite plugins. Tests cover pure logic in src/lib.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
