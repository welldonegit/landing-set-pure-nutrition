import { defineConfig } from 'vite';

export default defineConfig({
  // Відносні шляхи в збірці — сторінка працює і з підкаталогу.
  base: './',
  // public/ копіюється в dist як є: зображення відгуків підставляються
  // рядками в JS, тож Vite не може переписати ці шляхи під час збірки.
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
