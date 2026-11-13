import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['benchmark/**/*.ts'],
    testTimeout: 60_000,
  },
});
