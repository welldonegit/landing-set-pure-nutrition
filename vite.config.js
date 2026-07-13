import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

const page = (relativePath) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

/**
 * Спільні шматки розмітки (шапка, підвал) підставляються на етапі збірки
 * та в dev: `<!--include:header-->` замінюється вмістом src/partials/header.html.
 *
 * Це build-time включення, тож на виході статичний HTML — без мигання й без
 * залежності від JS. Нова сторінка підключає шапку одним коментарем.
 */
const htmlPartials = () => ({
  name: 'html-partials',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html.replace(/<!--\s*include:\s*([\w-]+)\s*-->/g, (_, name) => {
        const file = page(`./src/partials/${name}.html`);
        return readFileSync(file, 'utf8').trimEnd();
      });
    },
  },
});

/**
 * У production express.static сам редиректить /thanks -> /thanks/.
 * Повторюємо це в dev, щоб адреса поводилась однаково в обох режимах.
 */
const trailingSlashRedirect = () => ({
  name: 'trailing-slash-redirect',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/thanks') {
        res.writeHead(301, { Location: '/thanks/' });
        return res.end();
      }
      return next();
    });
  },
});

export default defineConfig({
  plugins: [htmlPartials(), trailingSlashRedirect()],
  // Відносні шляхи в збірці — сторінка працює і з підкаталогу.
  base: './',
  // public/ копіюється в dist як є: зображення відгуків підставляються
  // рядками в JS, тож Vite не може переписати ці шляхи під час збірки.
  publicDir: 'public',
  // Сайт багатосторінковий, а не SPA: жодного клієнтського роутингу немає.
  // Без цього Vite у dev віддавав би головну на будь-яку невідому адресу.
  appType: 'mpa',
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
    rollupOptions: {
      input: {
        main: page('./index.html'),
        thanks: page('./thanks/index.html'),
      },
    },
  },
});
