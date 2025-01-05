import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
    plugins: [viteSingleFile()],
    build: {
        target: 'es2015',
        assetsInlineLimit: 100000000,
        minify: true,
        sourcemap: false,
        outDir: 'dist',
        emptyOutDir: true,
        cssCodeSplit: false,
        brotliSize: false,
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    },
    assetsInclude: ['**/*.ogg', '**/*.m4a'],
});