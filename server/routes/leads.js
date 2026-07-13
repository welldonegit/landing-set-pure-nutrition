import { randomUUID } from 'node:crypto';

import { Router } from 'express';

import { validateLead } from '../validation/lead-validation.js';
import {
  deliverLead,
  TelegramNotConfiguredError,
  TelegramSendFailedError,
} from '../services/lead-service.js';
import { createKeycrmOrder } from '../services/keycrm-service.js';
import { verifyWarehouse } from '../services/nova-poshta-service.js';
import { productForSize } from '../config/products.js';
import { saveLead, recordDelivery } from '../services/lead-storage.js';
import { leadsRateLimit } from '../middleware/rate-limit.js';
import { logApiEvent } from '../logger.js';

export const leadsRouter = Router();

const UA_MAX_LENGTH = 200;

const clientIp = (req) => req.ip ?? req.socket?.remoteAddress ?? 'unknown';
const userAgent = (req) =>
  (req.get?.('user-agent') ?? '').slice(0, UA_MAX_LENGTH) || 'unknown';

/** Наслідок каналу пишемо окремим рядком JSONL. Збій цього запису не має
 *  ламати вже виконане — ловимо окремо й логуємо storage_event_failed. */
async function tryRecordDelivery(req, entry) {
  try {
    await recordDelivery(entry);
  } catch (error) {
    // Поле навмисно НЕ 'event': воно перетерло б назву події логера.
    logApiEvent('warn', req, 'storage_event_failed', {
      leadId: entry.leadId,
      failedEvent: entry.event,
      error: error?.code ?? error?.name ?? 'Error',
    });
  }
}

/** KeyCRM-канал. Ніколи не кидає — повертає підсумок. */
async function tryKeycrm(order) {
  try {
    const { duplicate } = await createKeycrmOrder(order);
    return { ok: true, event: 'keycrm_created', reason: duplicate ? 'duplicate' : undefined };
  } catch (error) {
    return { ok: false, event: 'keycrm_failed', code: error.code, reason: error.reason ?? error.code };
  }
}

/** Telegram-канал. Ніколи не кидає — повертає підсумок. */
async function tryTelegram(order) {
  try {
    await deliverLead(order);
    return { ok: true, event: 'telegram_sent' };
  } catch (error) {
    const notConfigured = error instanceof TelegramNotConfiguredError;
    const known = notConfigured || error instanceof TelegramSendFailedError;
    return {
      ok: false,
      event: 'telegram_failed',
      code: known ? error.code : 'TELEGRAM_SEND_FAILED',
      reason: notConfigured ? 'not_configured' : error.reason ?? 'error',
    };
  }
}

leadsRouter.post('/leads', leadsRateLimit, async (req, res) => {
  const { valid, errors, lead } = validateLead(req.body);

  if (!valid) {
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

  // Точку видачі звіряємо з НП: чи належить вона обраному місту й типу.
  // Якщо НП недоступна — не блокуємо замовлення (заявка не має губитися),
  // лише логуємо пропуск перевірки.
  if (lead.delivery.type !== 'doors') {
    const { city, warehouse, type } = lead.delivery;
    try {
      const belongs = await verifyWarehouse({
        cityRef: city.ref,
        type,
        ref: warehouse.ref,
        number: warehouse.number,
      });
      if (!belongs) {
        logApiEvent('warn', req, 'delivery_rejected', { status: 400, code: 'VALIDATION_ERROR' });
        return res.status(400).json({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: 'Перевірте правильність заповнення полів',
          errors: { 'delivery.warehouse': 'Точку видачі не знайдено в обраному місті' },
        });
      }
    } catch {
      logApiEvent('warn', req, 'delivery_verify_skipped', { code: 'NOVA_POSHTA_UNAVAILABLE' });
    }
  }

  const leadId = randomUUID();
  const createdAt = new Date().toISOString();
  const { utm, ...leadFields } = lead; // leadFields: name,phone,email,size,upsell,delivery
  const utmFields = Object.keys(utm ?? {});
  const sku = productForSize(leadFields.size)?.sku;

  // Замовлення, яке йде в обидва канали. leadId -> source_uuid у KeyCRM.
  const order = { leadId, ...leadFields, utm };

  // ── 1. Резервний запис. Його збій НЕ блокує зовнішні канали ──────────
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
      code: 'LEAD_STORAGE_FAILED',
      error: error?.code ?? error?.name ?? 'Error',
    });
  }

  // ── 2. KeyCRM і Telegram незалежно й паралельно ──────────────────────
  const [keycrm, telegram] = await Promise.allSettled([
    tryKeycrm(order),
    tryTelegram(order),
  ]).then((settled) => settled.map((s) => s.value));

  // ── 3. Записуємо наслідки та логуємо (без ПД) ────────────────────────
  await tryRecordDelivery(req, { event: keycrm.event, leadId, createdAt, reason: keycrm.reason });
  await tryRecordDelivery(req, { event: telegram.event, leadId, createdAt, reason: telegram.reason });

  logApiEvent(keycrm.ok ? 'info' : 'warn', req, keycrm.event, {
    leadId, sku, reason: keycrm.reason, code: keycrm.code,
  });
  logApiEvent(telegram.ok ? 'info' : 'warn', req, telegram.event, {
    leadId, reason: telegram.reason, code: telegram.code, utm: utmFields,
  });

  const channels = { keycrm: keycrm.ok, telegram: telegram.ok };

  // ── 4. Успіх, якщо спрацював хоча б один канал ───────────────────────
  if (keycrm.ok || telegram.ok) {
    return res.status(201).json({ ok: true, code: 'LEAD_DELIVERED', channels });
  }

  // Обидва канали впали. Заявка збережена в JSONL (якщо storage живий),
  // тож не втрачена, але доставки не було.
  logApiEvent('error', req, 'lead_delivery_failed', {
    leadId, status: 503, code: 'DELIVERY_FAILED', channels,
  });

  return res.status(503).json({
    ok: false,
    code: 'DELIVERY_FAILED',
    message: 'Не вдалося надіслати заявку. Зателефонуйте нам, будь ласка.',
  });
});
