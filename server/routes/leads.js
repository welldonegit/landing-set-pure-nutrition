import { Router } from 'express';

import { validateLead } from '../validation/lead-validation.js';
import { deliverLead, DeliveryNotConnectedError } from '../services/lead-service.js';
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

  try {
    await deliverLead(lead);
    logApiEvent('info', req, 'lead_delivered', { status: 201, code: 'ACCEPTED' });
    return res.status(201).json({ ok: true, code: 'ACCEPTED' });
  } catch (error) {
    if (error instanceof DeliveryNotConnectedError) {
      // 503, а не 200: заявка нікуди не доїхала. Відповідь 200 змусила б
      // моніторинг і логи вважати запит успішним.
      logApiEvent('warn', req, 'delivery_not_connected', {
        status: 503,
        code: error.code,
      });

      return res.status(503).json({
        ok: false,
        code: error.code,
        message: error.message,
      });
    }
    throw error;
  }
});
