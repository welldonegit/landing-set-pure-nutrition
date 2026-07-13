import {
  sendLeadToTelegram,
  TelegramNotConfiguredError,
  TelegramSendFailedError,
} from './telegram-service.js';

/**
 * Доставка заявки менеджеру.
 *
 * Зараз єдиний канал — Telegram. Коли з'являться інші (пошта, CRM),
 * оркестрація буде саме тут, а не в маршруті.
 */
export { TelegramNotConfiguredError, TelegramSendFailedError };

/**
 * @param {{name: string, phone: string, email: string, branch: string, size: string, utm: object}} lead
 * @returns {Promise<void>}
 * @throws {TelegramNotConfiguredError|TelegramSendFailedError}
 */
export async function deliverLead(lead) {
  await sendLeadToTelegram(lead);
}
