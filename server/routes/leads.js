import { Router } from 'express';

import { validateLead } from '../validation/lead-validation.js';
import { deliverLead, DeliveryNotConnectedError } from '../services/lead-service.js';

export const leadsRouter = Router();

leadsRouter.post('/leads', async (req, res) => {
  const { valid, errors, lead } = validateLead(req.body);

  if (!valid) {
    return res.status(400).json({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Перевірте правильність заповнення полів',
      errors,
    });
  }

  try {
    await deliverLead(lead);
    return res.status(201).json({ ok: true, code: 'ACCEPTED' });
  } catch (error) {
    if (error instanceof DeliveryNotConnectedError) {
      // 503, а не 200: заявка нікуди не доїхала. Відповідь 200 змусила б
      // моніторинг і логи вважати запит успішним.
      return res.status(503).json({
        ok: false,
        code: error.code,
        message: error.message,
      });
    }
    throw error;
  }
});
