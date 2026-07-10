import { randomUUID } from 'node:crypto';

import { Router } from 'express';

import { validateLead } from '../validation/lead-validation.js';
import {
  deliverLead,
  TelegramNotConfiguredError,
  TelegramSendFailedError,
} from '../services/lead-service.js';
import { saveLead, recordDelivery } from '../services/lead-storage.js';
import { leadsRateLimit } from '../middleware/rate-limit.js';
import { logApiEvent } from '../logger.js';

export const leadsRouter = Router();

const UA_MAX_LENGTH = 200;

const clientIp = (req) => req.ip ?? req.socket?.remoteAddress ?? 'unknown';
const userAgent = (req) =>
  (req.get?.('user-agent') ?? '').slice(0, UA_MAX_LENGTH) || 'unknown';

/** Наслідок доставки пишемо окремим рядком. Збій цього запису не має
 *  ламати вже виконане (заявка збережена й, можливо, доставлена). */
async function tryRecordDelivery(req, entry) {
  try {
    await recordDelivery(entry);
  } catch (error) {
    logApiEvent('warn', req, 'storage_event_failed', {
      leadId: entry.leadId,
      event: entry.event,
      error: error?.code ?? error?.name ?? 'Error',
    });
  }
}

leadsRouter.post('/leads', leadsRateLimit, async (req, res) => {
  const { valid, errors, lead } = validateLead(req.body);

  if (!valid) {
    // У лог іде тільки перелік проблемних полів, не їхній вміст.
    logApiEvent('warn', req, 'validation_failed', {
      status: 400,
      code: 'VALIDATION_ERROR',
      fields: Object.keys(errors),
    });

    return res.status(400).json({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Перевірте правильність заповнення полів',
      errors,
    });
  }

  const leadId = randomUUID();
  const createdAt = new Date().toISOString();
  const { utm, ...leadFields } = lead;
  const utmFields = Object.keys(utm ?? {});

  // ── 1. Спершу на диск, потім у Telegram ──────────────────────────────
  // Якщо збереження впало — доставку навіть не пробуємо: інакше заявка
  // могла б піти в Telegram, але не лишити сліду на сервері.
  try {
    await saveLead({
      leadId,
      createdAt,
      lead: leadFields,
      utm: utm ?? {},
      meta: { source: 'landing', ip: clientIp(req), userAgent: userAgent(req) },
    });

    logApiEvent('info', req, 'lead_saved', { leadId, utm: utmFields });
  } catch (error) {
    logApiEvent('error', req, 'lead_storage_failed', {
      leadId,
      status: 503,
      code: 'LEAD_STORAGE_FAILED',
      error: error?.code ?? error?.name ?? 'Error',
    });

    return res.status(503).json({
      ok: false,
      code: 'LEAD_STORAGE_FAILED',
      message: 'Не вдалося зберегти заявку. Зателефонуйте нам, будь ласка.',
    });
  }

  // ── 2. Доставка ──────────────────────────────────────────────────────
  try {
    await deliverLead({ ...leadFields, utm });

    await tryRecordDelivery(req, { event: 'telegram_sent', leadId, createdAt });
    logApiEvent('info', req, 'telegram_sent', {
      leadId,
      status: 201,
      code: 'LEAD_DELIVERED',
      utm: utmFields,
    });

    return res.status(201).json({ ok: true, code: 'LEAD_DELIVERED' });
  } catch (error) {
    const isNotConfigured = error instanceof TelegramNotConfiguredError;
    const isSendFailed = error instanceof TelegramSendFailedError;
    if (!isNotConfigured && !isSendFailed) throw error;

    const reason = isNotConfigured ? 'not_configured' : error.reason;

    await tryRecordDelivery(req, { event: 'telegram_failed', leadId, createdAt, reason });

    // Заявку збережено, тож вона не втрачена, навіть якщо Telegram лежить.
    logApiEvent('warn', req, 'telegram_failed', {
      leadId,
      status: 503,
      code: error.code,
      reason,
      utm: utmFields,
    });

    return res.status(503).json({
      ok: false,
      code: error.code,
      message: error.message,
    });
  }
});
