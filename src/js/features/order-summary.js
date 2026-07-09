import { SET_PRICE, TREAT_PRICE } from '../data/prices.js';
import { payOn, payOff } from './button-styles.js';

const PAY_NOTES = {
  cod: 'Менеджер передзвонить для підтвердження. Оплата при отриманні (накладений платіж).',
  online: 'Менеджер передзвонить і надішле посилання для онлайн-оплати карткою.',
};

/** Апсел зі смаколиками та вибір способу оплати. Підсумок рахується з цін. */
export function initOrderSummary(root = document) {
  initUpsell(root);
  initPayment(root);
}

function initUpsell(root) {
  const card = root.querySelector('[data-js="upsell"]');
  const knobOn = root.querySelector('[data-js="upsell-knob-on"]');
  const knobOff = root.querySelector('[data-js="upsell-knob-off"]');
  const line = root.querySelector('[data-js="upsell-line"]');
  const totals = root.querySelectorAll('[data-js="order-total"]');
  if (!card || !knobOn || !knobOff || !line) return;

  let enabled = true;

  const render = () => {
    knobOn.style.display = enabled ? 'block' : 'none';
    knobOff.style.display = enabled ? 'none' : 'block';
    line.style.display = enabled ? 'flex' : 'none';

    const total = SET_PRICE + (enabled ? TREAT_PRICE : 0);
    totals.forEach((el) => {
      el.textContent = `${total} ГРН`;
    });
  };

  card.addEventListener('click', () => {
    enabled = !enabled;
    render();
  });

  render();
}

function initPayment(root) {
  const note = root.querySelector('[data-js="pay-note"]');
  const buttons = root.querySelectorAll('[data-js="pay-method"]');
  if (!note || !buttons.length) return;

  let method = 'cod';

  const render = () => {
    buttons.forEach((btn) => {
      btn.setAttribute('style', btn.dataset.method === method ? payOn : payOff);
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
