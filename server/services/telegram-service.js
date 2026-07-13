import { config } from '../config/env.js';
import { UTM_FIELDS, UTM_LABELS } from '../../shared/utm.js';
import { DELIVERY_LABELS } from '../../shared/delivery.js';

/**
 * Надсилання заявки менеджеру в Telegram.
 *
 * Токен і chat_id беруться лише з config і ніколи не потрапляють
 * ні в клієнтський бандл, ні в логи, ні в текст помилок.
 */

const REQUEST_TIMEOUT_MS = 10_000;

/** Те, що бачить користувач. Причину відмови назовні не розкриваємо. */
const USER_MESSAGE = 'Надсилання замовлень ще не підключено. Зателефонуйте нам, будь ласка.';

export class TelegramNotConfiguredError extends Error {
  constructor() {
    super(USER_MESSAGE);
    this.name = 'TelegramNotConfiguredError';
    this.code = 'TELEGRAM_NOT_CONFIGURED';
  }
}

export class TelegramSendFailedError extends Error {
  /** @param {string} [reason] технічна причина — тільки для логів, не для клієнта */
  constructor(reason) {
    super(USER_MESSAGE);
    this.name = 'TelegramSendFailedError';
    this.code = 'TELEGRAM_SEND_FAILED';
    this.reason = reason ?? 'unknown';
  }
}

export const isTelegramConfigured = () =>
  config.telegram.tokenConfigured && config.telegram.chatConfigured;

/**
 * Значення користувача йде в текст повідомлення одним рядком.
 * Перенос рядка в імені дозволив би підробити рядок «Телефон: …».
 */
const singleLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const EMPTY = '—';

/**
 * Текст заявки. parse_mode свідомо не використовуємо: без нього Telegram
 * показує рядок як є, і розмітку в даних клієнта підробити неможливо.
 */
/** Рядки доставки: спосіб, місто та адреса або точка видачі. */
function deliveryLines(delivery) {
  if (!delivery) return [`Доставка: ${EMPTY}`];

  const method = DELIVERY_LABELS[delivery.type] ?? delivery.type;
  const lines = [
    `Спосіб доставки: ${singleLine(method)}`,
    `Місто: ${singleLine(delivery.city?.name) || EMPTY}`,
  ];

  if (delivery.type === 'doors') {
    lines.push(`Адреса: ${singleLine(delivery.address) || EMPTY}`);
  } else {
    const w = delivery.warehouse ?? {};
    const point = singleLine(w.name) || (w.number ? `№${singleLine(w.number)}` : EMPTY);
    const short = singleLine(w.shortAddress);
    lines.push(`Точка видачі: ${point}${short ? ` (${short})` : ''}`);
  }
  return lines;
}

export function formatLeadMessage(lead) {
  const utm = lead.utm ?? {};

  const utmLines = UTM_FIELDS.map(
    (field) => `${UTM_LABELS[field]}: ${singleLine(utm[field]) || EMPTY}`,
  );

  return [
    '🐶 Нова заявка з лендингу Pure Nutrition',
    '',
    '👤 Клієнт:',
    `Імʼя: ${singleLine(lead.name) || EMPTY}`,
    `Телефон: ${singleLine(lead.phone) || EMPTY}`,
    `Email: ${singleLine(lead.email) || EMPTY}`,
    `Сет: ${singleLine(lead.size) || EMPTY}`,
    '',
    '🚚 Доставка:',
    ...deliveryLines(lead.delivery),
    '',
    '📊 UTM Мітки:',
    ...utmLines,
  ].join('\n');
}

/**
 * @param {object} lead
 * @throws {TelegramNotConfiguredError|TelegramSendFailedError}
 */
export async function sendLeadToTelegram(lead) {
  if (!isTelegramConfigured()) throw new TelegramNotConfiguredError();

  const url = `${config.telegram.apiBase}/bot${config.telegram.botToken}/sendMessage`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegram.chatId,
        text: formatLeadMessage(lead),
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // У reason може бути URL із токеном — тому беремо лише назву помилки.
    throw new TelegramSendFailedError(`network:${error?.name ?? 'Error'}`);
  }

  const body = await response.json().catch(() => null);

  // Telegram пояснює причину в description ("chat not found", "Unauthorized"…).
  // Це технічний текст без токена й даних клієнта — саме те, що потрібно в лозі.
  const describe = (prefix) => {
    const description = typeof body?.description === 'string' ? body.description : '';
    return description ? `${prefix}:${description.slice(0, 120)}` : prefix;
  };

  if (!response.ok) throw new TelegramSendFailedError(describe(`http:${response.status}`));
  if (!body?.ok) throw new TelegramSendFailedError(describe('api:not_ok'));
}
