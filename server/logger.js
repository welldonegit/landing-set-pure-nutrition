import { randomUUID } from 'node:crypto';

/**
 * Логування подій API.
 *
 * Свідомо не пишемо персональні дані: ім'я, телефон, пошта й адреса
 * відділення не потрапляють у логи ніколи. Для розбору інцидентів
 * достатньо технічного мінімуму — часу, події, коду й короткого id запиту.
 *
 * IP та user-agent пишемо, бо без них неможливо розслідувати зловживання.
 * Пам'ятайте: IP — теж персональні дані, тож логи потребують строку зберігання.
 */

const UA_MAX_LENGTH = 120;

/** Кожен запит отримує короткий id — за ним склеюються рядки логу. */
export function requestContext(req, _res, next) {
  req.id = randomUUID().slice(0, 8);
  next();
}

const clientIp = (req) => req.ip ?? req.socket?.remoteAddress ?? 'unknown';

const userAgent = (req) =>
  (req.get?.('user-agent') ?? '').slice(0, UA_MAX_LENGTH) || 'unknown';

/**
 * @param {'info'|'warn'|'error'} level
 * @param {import('express').Request} req
 * @param {string} event  технічна назва події, напр. 'validation_failed'
 * @param {Record<string, unknown>} [fields]  лише безпечні поля
 */
export function logApiEvent(level, req, event, fields = {}) {
  const line = {
    ts: new Date().toISOString(),
    id: req.id,
    event,
    method: req.method,
    path: req.originalUrl,
    ip: clientIp(req),
    ua: userAgent(req),
    ...fields,
  };

  console[level](`[api] ${JSON.stringify(line)}`);
}
