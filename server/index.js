// Найперший імпорт: підвантажує .env до того, як інші модулі прочитають оточення.
import { config } from './config/env.js';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { leadsRouter } from './routes/leads.js';
import { requestContext, logApiEvent } from './logger.js';

const PORT = config.port;
const NODE_ENV = config.nodeEnv;
const IS_PRODUCTION = NODE_ENV === 'production';

const JSON_LIMIT = '10kb';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

export function createServer() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(express.json({ limit: JSON_LIMIT }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, env: NODE_ENV }));
  app.use('/api', leadsRouter);

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

createServer().listen(PORT, () => {
  console.info(`[api] ${NODE_ENV}: слухає http://localhost:${PORT}`);
  if (IS_PRODUCTION) console.info(`[api] статика з ${DIST}`);

  // Тільки булеві прапорці: ані токен, ані chat_id у лог не потрапляють.
  console.info(
    `[api] ${JSON.stringify({
      telegramTokenConfigured: config.telegram.tokenConfigured,
      telegramChatConfigured: config.telegram.chatConfigured,
    })}`,
  );
});
