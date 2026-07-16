import { qs } from '../utils/dom.js';

// Стан тумблера на рівні модуля, щоб форма могла його прочитати при відправленні.
let enabled = true;

/** Чи додав користувач смаколики. Читають order-form і order-total. */
export const isUpsellEnabled = () => enabled;

/** Тумблер «додати смаколики»: перемикає видимість. Суму рахує order-total. */
export function initUpsell(root = document) {
  const card = qs('upsell', root);
  const knobOn = qs('upsell-knob-on', root);
  const knobOff = qs('upsell-knob-off', root);
  const line = qs('upsell-line', root);
  if (!card || !knobOn || !knobOff || !line) return;

  const render = () => {
    knobOn.style.display = enabled ? 'block' : 'none';
    knobOff.style.display = enabled ? 'none' : 'block';
    line.style.display = enabled ? 'flex' : 'none';
  };

  card.addEventListener('click', () => {
    enabled = !enabled;
    render();
    // Повідомляємо order-total перерахувати суму.
    document.dispatchEvent(new Event('order:changed'));
  });

  render();
}
