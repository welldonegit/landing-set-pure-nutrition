import { SET_PRICE, TREAT_PRICE } from '../data/prices.js';
import { qs, qsa } from '../utils/dom.js';

// Стан тумблера на рівні модуля, щоб форма могла його прочитати при відправленні.
let enabled = true;

/** Чи додав користувач смаколики. Читає order-form при зборі заявки. */
export const isUpsellEnabled = () => enabled;

/** Тумблер «додати смаколики»: перемикає видимість і перераховує підсумок. */
export function initUpsell(root = document) {
  const card = qs('upsell', root);
  const knobOn = qs('upsell-knob-on', root);
  const knobOff = qs('upsell-knob-off', root);
  const line = qs('upsell-line', root);
  const totals = qsa('order-total', root);
  if (!card || !knobOn || !knobOff || !line) return;

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
