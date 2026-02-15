import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game/index.html'),
        rulebook: resolve(__dirname, 'rulebook/index.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
