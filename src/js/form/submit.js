/**
 * Єдина точка відправлення замовлення.
 *
 * Навмисно нічого не надсилає. Коли з'явиться бекенд, тіло цієї функції
 * зробить один POST на власний ендпоінт застосунку. Далі вже сам бекенд
 * звертатиметься до служби доставки, платіжного провайдера та сповіщень.
 *
 * Токенів, ключів і зовнішніх адрес тут бути не може: усе, що потрапляє
 * в клієнтський бандл, видно будь-кому у вкладці «Мережа» браузера.
 */

/** Помилка, яку показуємо користувачу, поки бекенда немає. */
export class NotConnectedError extends Error {
  constructor() {
    super('Надсилання замовлень ще не підключено. Зателефонуйте нам, будь ласка.');
    this.name = 'NotConnectedError';
  }
}

/**
 * @param {{name: string, phone: string, email: string, branch: string, size: string}} order
 *        phone уже нормалізований: +380XXXXXXXXX
 * @returns {Promise<void>}
 */
export async function submitOrder(order) {
  void order;
  throw new NotConnectedError();
}
