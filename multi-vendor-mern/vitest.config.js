import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    globals: true,
    hookTimeout: 180000,
    testTimeout: 60000,
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
  },
});