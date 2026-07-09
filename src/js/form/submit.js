/**
 * Єдина точка відправлення замовлення.
 *
 * Навмисно не реалізована. Замовлення піде на власний бекенд-ендпоінт,
 * який уже сам звертатиметься до Telegram, платіжного провайдера та CRM.
 * Жодних токенів і ключів у клієнтському коді бути не може —
 * усе, що потрапляє в бандл, доступне будь-кому у вкладці «Мережа».
 *
 * @param {object} order — дані, зібрані order-form.js
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-unused-vars
export async function submitOrder(order) {
  throw new Error('submitOrder: бекенд ще не підключено (крок 4).');
}
