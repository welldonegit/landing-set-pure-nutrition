/**
 * Правила валідації замовлення. Чисті функції, без DOM.
 * Заготовка під крок 4 — поки нікуди не підключені.
 */

// Український номер: 12 цифр, що починаються з 380. Роздільники ігноруються.
const PHONE_DIGITS = /^380\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const digitsOf = (value) => String(value).replace(/\D/g, '');

export const RULES = {
  name: (v) => (v.trim().length >= 2 ? null : "Вкажіть ім'я та прізвище"),
  phone: (v) =>
    PHONE_DIGITS.test(digitsOf(v)) ? null : 'Телефон у форматі +38 (0__) ___ __ __',
  email: (v) => (EMAIL.test(v.trim()) ? null : 'Перевірте адресу пошти'),
  branch: (v) => (v.trim().length >= 3 ? null : 'Вкажіть місто та № відділення'),
};

/**
 * @param {{name:string, phone:string, email:string, branch:string}} values
 * @returns {{valid: boolean, errors: Record<string,string>}}
 */
export function validateOrder(values) {
  const errors = {};
  for (const [field, check] of Object.entries(RULES)) {
    const message = check(values[field] ?? '');
    if (message) errors[field] = message;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
