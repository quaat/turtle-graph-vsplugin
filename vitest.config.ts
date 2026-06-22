import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['test/setup.ts'],
    environmentMatchGlobs: [['test/webview/**', 'jsdom']],
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
