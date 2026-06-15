import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/stickman-escape/',
  publicDir: 'public',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
