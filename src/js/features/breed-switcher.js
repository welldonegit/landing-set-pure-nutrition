import { SETS } from '../data/products.js';

const FLAVORS = ['beef', 'turkey', 'salmon'];

let breed = 'small';
const listeners = new Set();

/** Поточна лінійка: 'small' | 'large'. */
export const currentBreed = () => breed;

/** Підписка на зміну лінійки. */
export const onBreedChange = (fn) => listeners.add(fn);

const packSrc = (flavor) =>
  `images/pack-${flavor}${breed === 'large' ? '-large' : ''}.jpg`;

export function initBreedSwitcher(root = document) {
  const smallBtn = root.querySelector('[data-js="breed-small"]');
  const largeBtn = root.querySelector('[data-js="breed-large"]');
  const granuleEl = root.querySelector('[data-js="granule"]');
  if (!smallBtn || !largeBtn || !granuleEl) return;

  const render = () => {
    const set = SETS[breed];
    const isSmall = breed === 'small';

    smallBtn.classList.toggle('is-active', isSmall);
    largeBtn.classList.toggle('is-active', !isSmall);
    granuleEl.textContent = set.granule;

    for (const flavor of FLAVORS) {
      const img = root.querySelector(`[data-js="pack-${flavor}"]`);
      const meat = root.querySelector(`[data-js="meat-${flavor}"]`);
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
