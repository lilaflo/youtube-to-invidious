import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.js'),
        options: resolve(__dirname, 'src/options.js'),
      },
      output: {
        entryFileNames: 'src/[name].js',
        chunkFileNames: 'src/[name].js',
        format: 'iife'
      },
      preserveEntrySignatures: 'strict'
    },
    copyPublicDir: false,
  },
  publicDir: false,
});
