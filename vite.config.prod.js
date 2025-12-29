import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.js'),
        options: resolve(__dirname, 'src/options.html'),
      },
      output: {
        entryFileNames: 'src/[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    copyPublicDir: false,
  },
  publicDir: false,
});
