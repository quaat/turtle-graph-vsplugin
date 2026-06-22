import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the React webview bundle loaded by the extension host.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/webview',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/webview/main.tsx',
      output: {
        entryFileNames: 'webview.js',
        assetFileNames: 'webview.[ext]',
      },
    },
  },
});
