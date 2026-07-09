import { qs, qsa } from '../utils/dom.js';

const PAY_NOTES = {
  cod: 'Менеджер передзвонить для підтвердження. Оплата при отриманні (накладений платіж).',
  online: 'Менеджер передзвонить і надішле посилання для онлайн-оплати карткою.',
};

/**
 * Вибір способу оплати — поки лише перемикач і підказка.
 * Жодного платіжного провайдера не підключено.
 */
export function initPaymentMethod(root = document) {
  const note = qs('pay-note', root);
  const buttons = qsa('pay-method', root);
  if (!note || !buttons.length) return;

  let method = 'cod';

  const render = () => {
    buttons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.method === method);
    });
    note.textContent = PAY_NOTES[method];
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      method = btn.dataset.method;
      render();
    });
  });

  render();
}
