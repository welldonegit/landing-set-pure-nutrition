import { Router } from 'express';

import { validateLead } from '../validation/lead-validation.js';
import {
  deliverLead,
  TelegramNotConfiguredError,
  TelegramSendFailedError,
} from '../services/lead-service.js';
import { leadsRateLimit } from '../middleware/rate-limit.js';
import { logApiEvent } from '../logger.js';

export const leadsRouter = Router();

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

  // У логах лише назви наявних міток, не їхні значення.
  const utmFields = Object.keys(lead.utm ?? {});

  try {
    await deliverLead(lead);

    logApiEvent('info', req, 'lead_delivered', {
      status: 201,
      code: 'LEAD_DELIVERED',
      utm: utmFields,
    });

    return res.status(201).json({ ok: true, code: 'LEAD_DELIVERED' });
  } catch (error) {
    const isNotConfigured = error instanceof TelegramNotConfiguredError;
    const isSendFailed = error instanceof TelegramSendFailedError;
    if (!isNotConfigured && !isSendFailed) throw error;

    // 503, а не 200: заявка нікуди не доїхала. Відповідь 200 змусила б
    // моніторинг і логи вважати запит успішним.
    logApiEvent('error', req, isNotConfigured ? 'telegram_not_configured' : 'telegram_send_failed', {
      status: 503,
      code: error.code,
      // reason технічний і не містить ані токена, ані даних клієнта
      ...(isSendFailed ? { reason: error.reason } : {}),
      utm: utmFields,
    });

    return res.status(503).json({
      ok: false,
      code: error.code,
      message: error.message,
    });
  }
});
