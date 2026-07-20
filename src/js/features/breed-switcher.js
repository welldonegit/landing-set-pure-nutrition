import { SETS } from '../data/products.js';
import { qs } from '../utils/dom.js';

const FLAVORS = ['beef', 'turkey', 'salmon'];

let breed = 'small';
const listeners = new Set();

/** Поточна лінійка: 'small' | 'large'. */
export const currentBreed = () => breed;

/** Підписка на зміну лінійки. */
export const onBreedChange = (fn) => listeners.add(fn);

// Малі породи — jpg, великі — фото great pack (large).
const packSrc = (flavor) =>
  breed === 'large'
    ? `images/pack-${flavor}-large.jpg`
    : `images/pack-${flavor}.jpg`;

/** Перемикач лінійки: міняє фото пачок, вміст м'яса та підпис гранули. */
export function initBreedSwitcher(root = document) {
  const smallBtn = qs('breed-small', root);
  const largeBtn = qs('breed-large', root);
  const granuleEl = qs('granule', root);
  if (!smallBtn || !largeBtn || !granuleEl) return;

  const render = () => {
    const set = SETS[breed];
    const isSmall = breed === 'small';

    smallBtn.classList.toggle('is-active', isSmall);
    largeBtn.classList.toggle('is-active', !isSmall);
    granuleEl.textContent = set.granule;

    for (const flavor of FLAVORS) {
      const img = qs(`pack-${flavor}`, root);
      const meat = qs(`meat-${flavor}`, root);
      if (img) img.src = packSrc(flavor);
      if (meat) meat.textContent = set[flavor].meat;
    }

    listeners.forEach((fn) => fn(breed));
  };

  const select = (next) => {
    if (next === breed) return;
    breed = next;
    render();
  };

  smallBtn.addEventListener('click', () => select('small'));
  largeBtn.addEventListener('click', () => select('large'));
  render();
}
