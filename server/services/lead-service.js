/**
 * Доставка заявки менеджеру.
 *
 * Тут з'явиться інтеграція з Telegram (або CRM, або поштою). Саме тут, а не
 * у клієнтському коді: токен бота має жити лише в змінних оточення сервера.
 *
 * Поки що доставки немає, і ми про це чесно повідомляємо. Мовчазний «успіх»
 * був би гіршим за помилку: замовлення просто зникали б.
 */

/** Заявка прийнята сервером, але доставити її нікуди. */
export class DeliveryNotConnectedError extends Error {
  constructor() {
    super('Надсилання замовлень ще не підключено. Зателефонуйте нам, будь ласка.');
    this.name = 'DeliveryNotConnectedError';
    this.code = 'DELIVERY_NOT_CONNECTED';
  }
}

/** Чи налаштовано канал доставки. Поки що — ніколи. */
export const isDeliveryConfigured = () => false;

/**
 * @param {{name: string, phone: string, email: string, branch: string, size: string}} lead
 * @returns {Promise<void>}
 * @throws {DeliveryNotConnectedError}
 */
export async function deliverLead(lead) {
  void lead;
  if (!isDeliveryConfigured()) throw new DeliveryNotConnectedError();

  // Крок інтеграції: один запит до Telegram Bot API з токеном із process.env.
  throw new DeliveryNotConnectedError();
}
