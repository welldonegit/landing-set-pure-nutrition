import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Резервне збереження заявок у append-only JSONL.
 *
 * Єдина відповідальність цього модуля — записати рядок у файл. Ні Telegram,
 * ні валідації, ні логера, ні маршруту тут немає. Кожна заявка лягає на диск
 * ДО спроби доставки, тож навіть коли Telegram лежить, заявка не губиться.
 *
 * Формат: один рядок = один JSON-об'єкт, у кінці \n. Старі рядки не
 * редагуються й не перезаписуються — тільки дозапис у кінець.
 */

const DIR_MODE = 0o700; // тільки власник: у заявках є персональні дані
const FILE_MODE = 0o600;

// Шлях можна перевизначити лише для тестів (щоб змусити збій запису).
// Це шлях, а не секрет, тож читаємо його тут, не в config.
const STORAGE_DIR =
  process.env.LEADS_STORAGE_DIR ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'storage');

const LEADS_FILE = path.join(STORAGE_DIR, 'leads.jsonl');

/**
 * Дозаписує один рядок. open('a') + fsync + close: fsync гарантує, що дані
 * дійшли до диска, а не лишились у буфері ОС.
 */
async function appendLine(record) {
  await fs.mkdir(STORAGE_DIR, { recursive: true, mode: DIR_MODE });

  const handle = await fs.open(LEADS_FILE, 'a', FILE_MODE);
  try {
    await handle.appendFile(`${JSON.stringify(record)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

/**
 * Записує подію lead_saved. Кидає помилку, якщо запис не вдався —
 * тоді викликач НЕ має чіпати Telegram.
 *
 * @param {{ leadId: string, createdAt: string, lead: object, utm: object, meta: object }} entry
 */
export async function saveLead({ leadId, createdAt, lead, utm, meta }) {
  await appendLine({ event: 'lead_saved', leadId, createdAt, lead, utm, meta });
}

/**
 * Записує наслідок доставки: telegram_sent або telegram_failed.
 * Це вже після основної операції — викликач ловить помилку окремо
 * й логує storage_event_failed, не ламаючи вже виконане.
 *
 * @param {{ event: 'telegram_sent'|'telegram_failed', leadId: string, createdAt: string, reason?: string }} entry
 */
export async function recordDelivery({ event, leadId, createdAt, reason }) {
  const record = { event, leadId, createdAt };
  if (reason !== undefined) record.reason = reason;
  await appendLine(record);
}

/** Абсолютний шлях до файлу — для діагностики й тестів. */
export const leadsFilePath = () => LEADS_FILE;
