import { FULL } from '../data/products.js';
import { currentBreed } from './breed-switcher.js';

const FIELDS = [
  'emoji', 'title', 'ingredients', 'nutrition', 'micro', 'vitamins', 'energy', 'animal',
];

export function initProductModal(root = document) {
  const overlay = root.querySelector('[data-js="modal"]');
  const dialog = root.querySelector('[data-js="modal-dialog"]');
  const breedEl = root.querySelector('[data-js="modal-breed"]');
  if (!overlay || !dialog || !breedEl) return;

  const slots = Object.fromEntries(
    FIELDS.map((f) => [f, root.querySelector(`[data-js="modal-${f}"]`)]),
  );

  const open = (flavor) => {
    const breed = currentBreed();
    const item = FULL[breed][flavor];
    if (!item) return;

    for (const field of FIELDS) {
      if (slots[field]) slots[field].textContent = item[field];
    }
    breedEl.textContent =
      breed === 'small'
        ? 'Для малих порід · 300 г'
        : 'Для середніх і великих порід · 300 г';

    overlay.style.display = 'flex';
  };

  const close = () => {
    overlay.style.display = 'none';
  };

  root.querySelectorAll('[data-js="open-composition"]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.flavor));
  });

  overlay.addEventListener('click', close);
  dialog.addEventListener('click', (e) => e.stopPropagation());
  root
    .querySelector('[data-js="modal-close"]')
    ?.addEventListener('click', close);
}
