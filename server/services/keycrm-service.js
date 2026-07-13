import { config } from '../config/env.js';
import { productForSize, UPSELL } from '../config/products.js';
import { UTM_FIELDS } from '../../shared/utm.js';
import { describeDelivery } from '../../shared/delivery.js';

/**
 * Створення замовлення в KeyCRM.
 *
 * Токен береться лише з config і ніколи не потрапляє ні в бандл, ні в логи,
 * ні в текст помилок. Ціна — з серверного каталогу, не з фронтенду.
 */

const REQUEST_TIMEOUT_MS = 10_000;
const BUYER_COMMENT = 'Лендінг Pure Nutrition. Оплата при отриманні.';

export class KeycrmNotConfiguredError extends Error {
  constructor() {
    super('KeyCRM не налаштовано');
    this.name = 'KeycrmNotConfiguredError';
    this.code = 'KEYCRM_NOT_CONFIGURED';
  }
}

export class KeycrmSendFailedError extends Error {
  /** @param {string} [reason] технічна причина — тільки для логів */
  constructor(reason) {
    super('KeyCRM не прийняв замовлення');
    this.name = 'KeycrmSendFailedError';
    this.code = 'KEYCRM_SEND_FAILED';
    this.reason = reason ?? 'unknown';
  }
}

export class KeycrmRateLimitedError extends Error {
  constructor() {
    super('KeyCRM обмежив частоту запитів');
    this.name = 'KeycrmRateLimitedError';
    this.code = 'KEYCRM_RATE_LIMITED';
  }
}

export const isKeycrmConfigured = () => config.keycrm.configured;

/** Лише непорожні UTM у marketing. Порожній об'єкт -> поля немає взагалі. */
function marketingBlock(utm = {}) {
  const marketing = {};
  for (const field of UTM_FIELDS) {
    const value = utm[field];
    if (typeof value === 'string' && value) marketing[field] = value;
  }
  return marketing;
}

/**
 * Payload замовлення. Чиста функція — її окремо перевіряють тести.
 * source_uuid = leadId: KeyCRM за ним впізнає повтор і не створює дубль.
 */
export function buildOrderPayload(lead) {
  const product = productForSize(lead.size);
  if (!product) throw new KeycrmSendFailedError('unknown_sku');

  const products = [{ sku: product.sku, price: product.price, quantity: 1 }];
  // Смаколики — окрема позиція, лише коли клієнт увімкнув тумблер.
  if (lead.upsell) {
    products.push({ sku: UPSELL.sku, price: UPSELL.price, quantity: 1 });
  }

  // Людський опис доставки — у офіційне shipping_receive_point.
  const deliveryText = describeDelivery(lead.delivery);

  // warehouse.ref немає куди покласти в офіційній схемі shipping, тож
  // додаємо його в коментар, щоб менеджер бачив точний ідентифікатор точки.
  const warehouseRef = lead.delivery?.warehouse?.ref;
  const comment = warehouseRef
    ? `${BUYER_COMMENT}\nДоставка: ${deliveryText}\nWarehouseRef: ${warehouseRef}`
    : `${BUYER_COMMENT}\nДоставка: ${deliveryText}`;

  const payload = {
    source_id: config.keycrm.sourceId,
    source_uuid: lead.leadId,
    buyer: {
      full_name: lead.name,
      phone: lead.phone,
      email: lead.email,
    },
    products,
    shipping: {
      shipping_receive_point: deliveryText,
    },
    buyer_comment: comment,
  };

  const marketing = marketingBlock(lead.utm);
  if (Object.keys(marketing).length > 0) payload.marketing = marketing;

  return payload;
}

const readBody = async (response) => response.json().catch(() => null);

// Повторний source_uuid: KeyCRM відхиляє дубль. Точний формат відповіді
// не гарантований, тож розпізнаємо і за статусом, і за згадкою source_uuid.
const looksDuplicate = (status, body) => {
  if (status !== 409 && status !== 422) return false;
  const text = JSON.stringify(body ?? '').toLowerCase();
  return text.includes('source_uuid') || text.includes('duplicate') || text.includes('вже існує');
};

/**
 * @param {object} lead — { leadId, name, phone, email, branch, size, utm }
 * @returns {Promise<{ duplicate: boolean }>} успіх; duplicate=true, якщо замовлення вже було
 * @throws {KeycrmNotConfiguredError|KeycrmRateLimitedError|KeycrmSendFailedError}
 */
export async function createKeycrmOrder(lead) {
  if (!isKeycrmConfigured()) throw new KeycrmNotConfiguredError();

  const payload = buildOrderPayload(lead);

  let response;
  try {
    response = await fetch(`${config.keycrm.apiBase}/v1/order`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.keycrm.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? 'timeout' : `network:${error?.name ?? 'Error'}`;
    throw new KeycrmSendFailedError(reason);
  }

  if (response.ok) return { duplicate: false };

  const body = await readBody(response);

  if (response.status === 429) throw new KeycrmRateLimitedError();
  if (looksDuplicate(response.status, body)) return { duplicate: true };

  throw new KeycrmSendFailedError(`http:${response.status}`);
}
