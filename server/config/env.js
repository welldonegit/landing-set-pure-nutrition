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
};
