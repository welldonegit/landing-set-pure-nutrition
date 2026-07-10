import { qs } from '../utils/dom.js';

/**
 * Плаваюча кнопка «Замовити набір».
 *
 * Показуємо, коли герой прокручено (перший екран позаду), і ховаємо,
 * коли на екрані сама форма замовлення — щоб не перекривати справжню
 * кнопку відправлення. Стан рахуємо через IntersectionObserver, а не
 * слухач scroll: він не спрацьовує щокадру.
 */
export function initStickyCta(root = document) {
  const bar = qs('sticky-cta', root);
  const hero = root.querySelector('.hero');
  const order = root.querySelector('#order');
  if (!bar || !hero) return;

  // Без IntersectionObserver (зовсім старий браузер) лишаємо кнопку прихованою:
  // сторінка працює, просто без цієї зручності.
  if (typeof IntersectionObserver === 'undefined') return;

  bar.hidden = false;

  let heroVisible = true;
  let orderVisible = false;

  const sync = () => {
    bar.classList.toggle('is-visible', !heroVisible && !orderVisible);
  };

  new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      sync();
    },
    { threshold: 0 },
  ).observe(hero);

  if (order) {
    new IntersectionObserver(
      ([entry]) => {
        orderVisible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    ).observe(order);
  }
}
