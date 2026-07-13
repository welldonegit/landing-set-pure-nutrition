import 'dotenv/config';

/**
 * Завантаження .env і безпечне читання оточення. Більше нічого.
 *
 * Решта серверних модулів бере значення звідси, а не з process.env напряму:
 * константа, обчислена на верхньому рівні модуля, прочитала б порожній
 * process.env ще до того, як dotenv встиг завантажити файл.
 *
 * dotenv не перезаписує вже наявні змінні — справжнє оточення (Docker,
 * systemd, CI) завжди сильніше за файл .env.
 *
 * Значення токена й chat_id не логуються ніде. Для діагностики є
 * булеві прапорці tokenConfigured / chatConfigured.
 *
 * Цей модуль — суто серверний. Клієнтський код (src/) і спільний (shared/)
 * його не імпортують: інакше секрети потрапили б у бандл Vite.
 */

// Обрізаємо пробіли: зайвий символ у кінці рядка .env зламав би адресу запиту.
const read = (name) => (process.env[name] ?? '').trim();

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',

  telegram: {
    botToken: read('TELEGRAM_BOT_TOKEN'),
    chatId: read('TELEGRAM_CHAT_ID'),
    // Перевизначають лише в тестах, щоб не ходити в мережу.
    apiBase: read('TELEGRAM_API_BASE') || 'https://api.telegram.org',
    tokenConfigured: Boolean(read('TELEGRAM_BOT_TOKEN')),
    chatConfigured: Boolean(read('TELEGRAM_CHAT_ID')),
  },

  keycrm: {
    apiToken: read('KEYCRM_API_TOKEN'),
    apiBase: read('KEYCRM_API_BASE') || 'https://openapi.keycrm.app',
    // source_id у payload має бути числом.
    sourceId: Number(read('KEYCRM_SOURCE_ID')),
    // Налаштовано лише коли є токен і коректний числовий source_id.
    configured:
      Boolean(read('KEYCRM_API_TOKEN')) &&
      read('KEYCRM_SOURCE_ID') !== '' &&
      Number.isFinite(Number(read('KEYCRM_SOURCE_ID'))),
  },

  novaPoshta: {
    apiKey: read('NOVA_POSHTA_API_KEY'),
    apiBase: read('NOVA_POSHTA_API_BASE') || 'https://api.novaposhta.ua/v2.0/json/',
    configured: Boolean(read('NOVA_POSHTA_API_KEY')),
  },
};
