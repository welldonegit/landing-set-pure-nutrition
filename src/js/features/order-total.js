import { SIZE_OPTIONS, DEFAULT_SIZE, TREAT_PRICE } from '../data/prices.js';
import { isUpsellEnabled } from './upsell.js';
import { qs, qsa } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';

/**
 * Підсумок замовлення: ціна залежить від обраного розміру + смаколиків.
 * Оновлює обидва «Разом», підпис набору та закреслену ціну.
 * Перераховується на зміну розміру та на подію order:changed (тумблер апселу).
 */
export function initOrderTotal(root = document) {
  const select = qs('order-size', root);
  const totals = qsa('order-total', root);
  const setLabel = qs('set-label', root);
  const oldPrice = qs('set-old-price', root);
  if (totals.length === 0) return;

  const render = () => {
    const size = select?.value ?? DEFAULT_SIZE;
    const info = SIZE_OPTIONS[size] ?? SIZE_OPTIONS[DEFAULT_SIZE];
    const total = info.price + (isUpsellEnabled() ? TREAT_PRICE : 0);

    totals.forEach((el) => {
      el.textContent = `${formatPrice(total)} ГРН`;
    });
    if (setLabel) setLabel.textContent = info.setLabel;
    if (oldPrice) oldPrice.textContent = `${formatPrice(info.oldPrice)} грн`;
  };

  select?.addEventListener('change', render);
  document.addEventListener('order:changed', render);
  render();
}
