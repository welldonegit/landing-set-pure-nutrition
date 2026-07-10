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
    // Форма ходить на відносний /api/leads. У dev його обслуговує
    // окремий Express на 3001; у продакшені обидва за одним доменом.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
