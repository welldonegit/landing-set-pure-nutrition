import { rateLimit } from 'express-rate-limit';

import { logApiEvent } from '../logger.js';

const WINDOW_MS = 10 * 60 * 1000; // 10 хвилин
const MAX_REQUESTS = 5;

/**
 * Обмеження частоти для заявок. Навішується тільки на POST /api/leads:
 * статику й решту сторінки воно не чіпає.
 *
 * Це захист від флуду, а не від цілеспрямованої атаки: лічильник живе
 * у пам'яті процесу й обнуляється при перезапуску. Для кількох інстансів
 * знадобиться спільне сховище (Redis).
 */
export const leadsRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    logApiEvent('warn', req, 'rate_limited', { status: 429, code: 'RATE_LIMITED' });
    res.status(429).json({
      ok: false,
      code: 'RATE_LIMITED',
      message: 'Забагато спроб. Спробуйте пізніше.',
    });
  },
});
