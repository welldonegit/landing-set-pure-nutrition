import { validateOrder, VALIDATED_FIELDS } from '../../../shared/order-validation.js';
import { submitOrder, ValidationError } from './submit.js';
import { initPhoneMask } from './phone-mask.js';
import { normalizePhone } from '../../../shared/phone.js';
import { isUpsellEnabled } from '../features/upsell.js';
import { getDelivery, validateDeliveryUI } from '../features/delivery.js';
import { qs } from '../utils/dom.js';

const FIELDS = [...VALIDATED_FIELDS, 'size'];

/** Сторінка подяки. Відкривається лише після реальної доставки заявки. */
const THANKS_URL = '/thanks/';

/** Показ або приховування помилки під конкретним полем. */
function setFieldError(form, field, message) {
  const input = form.elements[field];
  const errorEl = qs(`error-${field}`, form);
  if (!input || !errorEl) return;

  errorEl.textContent = message ?? '';
  errorEl.hidden = !message;
  input.classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function setStatus(statusEl, message, kind) {
  if (!statusEl) return;
  statusEl.textContent = message ?? '';
  statusEl.hidden = !message;
  statusEl.classList.toggle('order-form__status--error', kind === 'error');
}

/** Значення полів у простий об'єкт. */
export function readOrder(form) {
  return Object.fromEntries(
    FIELDS.map((field) => [field, form.elements[field]?.value ?? '']),
  );
}

export function initOrderForm(root = document) {
  const form = qs('order-form', root);
  if (!form) return;

  const statusEl = qs('order-status', form);
  const submitButton = form.querySelector('[type="submit"]');
  initPhoneMask(form.elements.phone);

  // Помилка зникає, щойно користувач починає виправляти поле.
  for (const field of VALIDATED_FIELDS) {
    form.elements[field]?.addEventListener('input', () => {
      setFieldError(form, field, null);
      setStatus(statusEl, null);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const values = readOrder(form);
    const { valid, errors } = validateOrder(values);

    for (const field of VALIDATED_FIELDS) {
      setFieldError(form, field, errors[field]);
    }

    // Доставка перевіряється окремо і показує власні помилки.
    const deliveryValid = validateDeliveryUI();

    if (!valid || !deliveryValid) {
      setStatus(statusEl, null);
      if (!valid) form.elements[VALIDATED_FIELDS.find((f) => errors[f])]?.focus();
      return;
    }

    // Далі йде вже нормалізований номер, а не те, що показувала маска.
    const data = {
      ...values,
      phone: normalizePhone(values.phone),
      upsell: isUpsellEnabled(),
      delivery: getDelivery(),
    };

    // Захист від подвійного надсилання, поки триває запит.
    if (submitButton) submitButton.disabled = true;
    setStatus(statusEl, null);

    try {
      await submitOrder(data);
      // Сюди можна дійти лише при ok: true від бекенда. Поки доставки немає,
      // submitOrder завжди кидає помилку, і редиректу не буде.
      window.location.assign(THANKS_URL);
      return;
    } catch (error) {
      // Сервер перевіряє дані ще раз і може відхилити те, що браузер пропустив.
      if (error instanceof ValidationError) {
        for (const [field, message] of Object.entries(error.errors)) {
          if (VALIDATED_FIELDS.includes(field)) setFieldError(form, field, message);
        }
        form.elements[VALIDATED_FIELDS.find((f) => error.errors[f])]?.focus();
      }
      setStatus(statusEl, error.message, 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
