import { validateOrder, VALIDATED_FIELDS } from '../../shared/order-validation.js';
import { normalizePhone } from '../../shared/phone.js';
import { UTM_FIELDS, UTM_MAX_LENGTH } from '../../shared/utm.js';
import { productForSize } from '../config/products.js';

/**
 * Серверна перевірка заявки.
 *
 * Спільні правила беремо з shared/, але сервер нічого не приймає на віру:
 * клієнт може надіслати що завгодно, а не лише те, що вміє наша форма.
 * Тому спершу перевіряємо форму даних, і лише потім — їхній зміст.
 */

const TEXT_FIELDS = [...VALIDATED_FIELDS, 'size'];
const ALLOWED_FIELDS = [...TEXT_FIELDS, 'utm', 'upsell'];
const MAX_FIELD_LENGTH = 200;

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * UTM необов'язковий. Зайві ключі всередині відхиляємо, а не ігноруємо:
 * мовчазне прибирання ховає помилки інтеграції з рекламним кабінетом.
 */
function validateUtm(raw, errors) {
  if (raw === undefined) return {};

  if (!isPlainObject(raw)) {
    errors.utm = 'Очікується об’єкт';
    return {};
  }

  const utm = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!UTM_FIELDS.includes(key)) {
      errors[`utm.${key}`] = 'Невідома UTM-мітка';
      continue;
    }
    if (typeof value !== 'string') {
      errors[`utm.${key}`] = 'Очікується рядок';
      continue;
    }
    if (value.length > UTM_MAX_LENGTH) {
      errors[`utm.${key}`] = `Не більше ${UTM_MAX_LENGTH} символів`;
      continue;
    }

    // Порожній рядок рівносильний відсутності мітки.
    const trimmed = value.trim();
    if (trimmed) utm[key] = trimmed;
  }
  return utm;
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, errors: Record<string,string>, lead?: object}}
 */
export function validateLead(payload) {
  if (!isPlainObject(payload)) {
    return { valid: false, errors: { _form: 'Очікується об’єкт із даними замовлення' } };
  }

  const errors = {};

  // Зайві поля — ознака або помилки клієнта, або спроби щось підсунути.
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_FIELDS.includes(key)) errors[key] = 'Невідоме поле';
  }

  const values = {};
  for (const field of TEXT_FIELDS) {
    const raw = payload[field];
    if (raw === undefined) {
      values[field] = '';
      continue;
    }
    if (typeof raw !== 'string') {
      errors[field] = 'Очікується рядок';
      continue;
    }
    if (raw.length > MAX_FIELD_LENGTH) {
      errors[field] = `Не більше ${MAX_FIELD_LENGTH} символів`;
      continue;
    }
    values[field] = raw.trim();
  }

  // size має точно збігатися з позицією каталогу — інакше нема що замовляти.
  if (values.size !== undefined && !productForSize(values.size)) {
    errors.size = 'Оберіть розмір собаки зі списку';
  }

  // upsell необов'язковий; приймаємо лише булеве значення.
  if (payload.upsell !== undefined && typeof payload.upsell !== 'boolean') {
    errors.upsell = 'Очікується true або false';
  }

  const utm = validateUtm(payload.utm, errors);

  if (Object.keys(errors).length > 0) return { valid: false, errors };

  // Ті самі правила, що й у браузері.
  const result = validateOrder(values);
  if (!result.valid) return { valid: false, errors: result.errors };

  return {
    valid: true,
    errors: {},
    // Телефон зберігаємо в канонічному вигляді, хай там що надіслав клієнт.
    lead: {
      ...values,
      phone: normalizePhone(values.phone),
      upsell: payload.upsell === true,
      utm,
    },
  };
}
