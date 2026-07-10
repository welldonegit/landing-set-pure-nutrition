/**
 * Єдина точка відправлення замовлення — POST на власний бекенд.
 *
 * Адреса відносна й та сама, що й у сторінки: жодних зовнішніх сервісів
 * звідси не викликаємо. Telegram, оплата й CRM живуть за цим ендпоінтом,
 * на сервері, разом зі своїми токенами. Усе, що потрапляє в клієнтський
 * бандл, видно будь-кому у вкладці «Мережа» браузера.
 */
const ENDPOINT = '/api/leads';

/** Сервер відхилив дані. `errors` — повідомлення за полями. */
export class ValidationError extends Error {
  constructor(errors, message) {
    super(message || 'Перевірте правильність заповнення полів');
    this.name = 'ValidationError';
    this.errors = errors ?? {};
  }
}

/** Заявку прийнято, але доставляти її поки нікуди. */
export class DeliveryNotConnectedError extends Error {
  constructor(message) {
    super(message || 'Надсилання замовлень ще не підключено. Зателефонуйте нам, будь ласка.');
    this.name = 'DeliveryNotConnectedError';
  }
}

/** До сервера не достукались: немає мережі, він лежить або віддав щось дивне. */
export class NetworkError extends Error {
  constructor(message) {
    super(message || 'Не вдалося зв’язатися з сервером. Перевірте інтернет і спробуйте ще раз.');
    this.name = 'NetworkError';
  }
}

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * @param {{name: string, phone: string, email: string, branch: string, size: string}} order
 *        phone уже нормалізований: +380XXXXXXXXX
 * @returns {Promise<void>} — успішно завершується, лише якщо заявку доставлено
 */
export async function submitOrder(order) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch {
    throw new NetworkError();
  }

  const body = await parseJson(response);

  if (response.ok) return;

  if (response.status === 400 && body?.code === 'VALIDATION_ERROR') {
    throw new ValidationError(body.errors, body.message);
  }

  if (body?.code === 'DELIVERY_NOT_CONNECTED') {
    throw new DeliveryNotConnectedError(body.message);
  }

  throw new NetworkError(
    body?.message || 'Сервер тимчасово недоступний. Спробуйте, будь ласка, пізніше.',
  );
}
