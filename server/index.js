// Найперший імпорт: підвантажує .env до того, як інші модулі прочитають оточення.
import { config } from './config/env.js';

import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { leadsRouter } from './routes/leads.js';
import { novaPoshtaRouter } from './routes/nova-poshta.js';
import { requestContext, logApiEvent } from './logger.js';

const PORT = config.port;
const NODE_ENV = config.nodeEnv;
const IS_PRODUCTION = NODE_ENV === 'production';

const HOST = '0.0.0.0';
const JSON_LIMIT = '10kb';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DIST_INDEX = path.join(DIST, 'index.html');

export function createServer() {
  const app = express();

  app.disable('x-powered-by');

  // trust proxy лише коли явно задано через TRUST_PROXY (не вслiпу).
  if (config.trustProxy) {
    const raw = config.trustProxy;
    // число -> кількість проксі; інакше рядок (напр. 'loopback') як є.
    app.set('trust proxy', /^\d+$/.test(raw) ? Number(raw) : raw);
  }

  app.use(requestContext);
  app.use(express.json({ limit: JSON_LIMIT }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, env: NODE_ENV }));
  app.use('/api', leadsRouter);
  app.use('/api/nova-poshta', novaPoshtaRouter);

  // Невідомий шлях під /api не має провалюватись у статику.
  app.use('/api', (req, res) => {
    logApiEvent('warn', req, 'api_not_found', { status: 404, code: 'NOT_FOUND' });
    res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Ресурс не знайдено' });
  });

  // У production Express сам віддає зібраний фронтенд. У dev статику
  // обслуговує Vite, а сюди приходять лише запити з його proxy.
  //
  // SPA-fallback не додаємо навмисно: сайт односторінковий без клієнтського
  // роутингу (навігація — якорі #order, #calc). Fallback віддавав би головну
  // на будь-яку неіснуючу адресу зі статусом 200, псуючи індексацію.
  if (IS_PRODUCTION) {
    app.use(express.static(DIST, { index: 'index.html' }));
  }

  // Некоректний JSON у тілі запиту.
  app.use((error, req, res, next) => {
    if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
      logApiEvent('warn', req, 'invalid_payload', { status: 400, code: 'INVALID_JSON' });
      return res.status(400).json({
        ok: false,
        code: 'INVALID_JSON',
        message: 'Тіло запиту не є коректним JSON',
      });
    }
    return next(error);
  });

  // Остання лінія: назовні йде код помилки, а не її подробиці.
  app.use((error, req, res, _next) => {
    logApiEvent('error', req, 'unexpected_error', {
      status: 500,
      code: 'INTERNAL_ERROR',
      error: error?.name ?? 'Error',
    });
    console.error(error);

    res.status(500).json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Внутрішня помилка сервера',
    });
  });

  return app;
}

// У production фронтенд віддає сам Express. Якщо збірки немає — падаємо
// з чіткою помилкою, а не піднімаємо сайт, що віддає 404 на кожну сторінку.
if (IS_PRODUCTION && !existsSync(DIST_INDEX)) {
  console.error(
    `[api] fatal: не знайдено ${DIST_INDEX}. Спершу виконайте "npm run build".`,
  );
  process.exit(1);
}

const server = createServer().listen(PORT, HOST, () => {
  console.info(`[api] ${NODE_ENV}: слухає http://${HOST}:${PORT}`);
  if (IS_PRODUCTION) console.info(`[api] статика з ${DIST}`);

  // Тільки булеві прапорці: ані токен, ані chat_id у лог не потрапляють.
  console.info(
    `[api] ${JSON.stringify({
      telegramTokenConfigured: config.telegram.tokenConfigured,
      telegramChatConfigured: config.telegram.chatConfigured,
    })}`,
  );
});

// Коректне завершення: Hostinger шле SIGTERM при рестарті/деплої.
function shutdown(signal) {
  console.info(`[api] ${signal}: закриваю сервер…`);
  server.close(() => {
    console.info('[api] сервер зупинено');
    process.exit(0);
  });
  // Аварійний вихід, якщо з'єднання не закрилися вчасно.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
