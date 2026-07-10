import { phoneProblem } from './phone.js';

/**
 * Правила валідації замовлення. Чисті функції, без DOM.
 * Телефон перевіряється за нормалізованим значенням (лише цифри),
 * а не за тим, що показує маска.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PHONE_MESSAGES = {
  empty: 'Вкажіть номер телефону',
  length: 'Номер має містити 12 цифр: +38(0XX)-XXX-XXXX',
  country: 'Додайте код країни: +38(0XX)-XXX-XXXX',
  code: 'Такого мобільного коду в Україні немає',
};

export const RULES = {
  name: (v) =>
    v.trim().length >= 2 ? null : "Вкажіть ім'я та прізвище",

  phone: (v) => {
    const problem = phoneProblem(v);
    return problem ? PHONE_MESSAGES[problem] : null;
  },

  email: (v) =>
    EMAIL.test(v.trim()) ? null : 'Перевірте адресу електронної пошти',

  branch: (v) =>
    v.trim().length >= 3 ? null : 'Вкажіть місто та номер відділення',
};

/** Поля, які перевіряємо. Порядок визначає, на яке з них стане фокус. */
export const VALIDATED_FIELDS = Object.keys(RULES);

/**
 * @param {Record<string, string>} values
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateOrder(values) {
  const errors = {};
  for (const field of VALIDATED_FIELDS) {
    const message = RULES[field](values[field] ?? '');
    if (message) errors[field] = message;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
