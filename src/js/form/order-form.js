import { validateOrder } from './validate.js';
import { submitOrder } from './submit.js';

/**
 * Логіка форми замовлення — заготовка.
 *
 * НЕ підключена в main.js: у полів розмітки поки немає name/id,
 * а тег <form> відсутній. І те, й інше з'явиться на кроці 4 разом
 * із показом помилок. Тут лише каркас: зібрати -> перевірити -> відправити.
 */
const FIELDS = ['name', 'phone', 'email', 'branch'];

/** Зчитує значення полів у простий об'єкт. */
export function readOrder(form) {
  return Object.fromEntries(
    FIELDS.map((field) => [field, form.elements[field]?.value ?? '']),
  );
}

export function initOrderForm(root = document) {
  const form = root.querySelector('[data-js="order-form"]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const order = readOrder(form);
    const { valid, errors } = validateOrder(order);
    if (!valid) {
      // Крок 4: показати errors поруч із полями.
      return;
    }

    await submitOrder(order);
  });
}
