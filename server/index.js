import express from 'express';

import { leadsRouter } from './routes/leads.js';

const PORT = Number(process.env.PORT) || 3001;
const JSON_LIMIT = '10kb';

export function createServer() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: JSON_LIMIT }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', leadsRouter);

  // Некоректний JSON у тілі запиту.
  app.use((error, _req, res, next) => {
    if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
      return res.status(400).json({
        ok: false,
        code: 'INVALID_JSON',
        message: 'Тіло запиту не є коректним JSON',
      });
    }
    return next(error);
  });

  // Остання лінія: назовні йде код помилки, а не її подробиці.
  app.use((error, _req, res, _next) => {
    console.error('[api] необроблена помилка:', error);
    res.status(500).json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Внутрішня помилка сервера',
    });
  });

  return app;
}

createServer().listen(PORT, () => {
  console.log(`[api] слухає http://localhost:${PORT}`);
});
