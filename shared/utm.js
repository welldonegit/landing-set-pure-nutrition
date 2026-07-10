/**
 * UTM-мітки: спільний перелік полів для браузера й сервера.
 * Зберігаємо рівно ці п'ять і нічого більше.
 */

export const UTM_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

export const UTM_MAX_LENGTH = 200;

/** Людські підписи для повідомлення менеджеру. */
export const UTM_LABELS = {
  utm_source: 'Джерело',
  utm_medium: 'Канал',
  utm_campaign: 'Кампанія',
  utm_content: 'Контент',
  utm_term: 'Ключове слово',
};

/**
 * Бере лише дозволені поля, обрізає до ліміту, викидає порожні.
 * Нічого не валідує — просто чистить. Для сервера є окрема сувора перевірка.
 *
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, string>}
 */
export function pickUtm(raw) {
  if (raw === null || typeof raw !== 'object') return {};

  const result = {};
  for (const field of UTM_FIELDS) {
    const value = raw[field];
    if (typeof value !== 'string') continue;

    const trimmed = value.trim().slice(0, UTM_MAX_LENGTH);
    if (trimmed) result[field] = trimmed;
  }
  return result;
}
