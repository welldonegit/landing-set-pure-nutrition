import { validateOrder, VALIDATED_FIELDS } from './validate.js';
import { submitOrder } from './submit.js';
import { initPhoneMask } from './phone-mask.js';
import { normalizePhone } from '../utils/phone.js';
import { qs } from '../utils/dom.js';

const FIELDS = [...VALIDATED_FIELDS, 'size'];

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

    if (!valid) {
      setStatus(statusEl, null);
      form.elements[VALIDATED_FIELDS.find((f) => errors[f])]?.focus();
      return;
    }

    // Далі йде вже нормалізований номер, а не те, що показувала маска.
    const data = { ...values, phone: normalizePhone(values.phone) };

    try {
      await submitOrder(data);
      setStatus(statusEl, 'Замовлення прийнято.', 'success');
    } catch (error) {
      setStatus(statusEl, error.message, 'error');
    }
  });
}
