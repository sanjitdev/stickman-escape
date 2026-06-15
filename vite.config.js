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
        rollupOptions: {
            output: { manualChunks: { phaser: ['phaser'] } },
        },
    },
});
//# sourceMappingURL=vite.config.js.map