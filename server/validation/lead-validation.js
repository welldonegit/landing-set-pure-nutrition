import { validateOrder, VALIDATED_FIELDS } from '../../shared/order-validation.js';
import { normalizePhone } from '../../shared/phone.js';

/**
 * Серверна перевірка заявки.
 *
 * Спільні правила беремо з shared/, але сервер нічого не приймає на віру:
 * клієнт може надіслати що завгодно, а не лише те, що вміє наша форма.
 * Тому спершу перевіряємо форму даних, і лише потім — їхній зміст.
 */

const ALLOWED_FIELDS = [...VALIDATED_FIELDS, 'size'];
const MAX_FIELD_LENGTH = 200;

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, errors: Record<string,string>, lead?: object}}
 */
export function validateLead(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: { _form: 'Очікується об’єкт із даними замовлення' } };
  }

  const errors = {};

  // Зайві поля — ознака або помилки клієнта, або спроби щось підсунути.
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_FIELDS.includes(key)) errors[key] = 'Невідоме поле';
  }

  const values = {};
  for (const field of ALLOWED_FIELDS) {
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

  if (Object.keys(errors).length > 0) return { valid: false, errors };

  // Ті самі правила, що й у браузері.
  const result = validateOrder(values);
  if (!result.valid) return { valid: false, errors: result.errors };

  return {
    valid: true,
    errors: {},
    // Телефон зберігаємо в канонічному вигляді, хай там що надіслав клієнт.
    lead: { ...values, phone: normalizePhone(values.phone) },
  };
}
