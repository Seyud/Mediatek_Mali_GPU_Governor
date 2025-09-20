import { defineConfig } from 'vite';
export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: { outDir: '../webroot', emptyOutDir: true },
  server: { port: 5173, host: true }
});
