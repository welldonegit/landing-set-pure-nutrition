import { FULL } from '../data/products.js';
import { currentBreed } from './breed-switcher.js';
import { qs, qsa, qsMap } from '../utils/dom.js';
import { createOverlay } from '../utils/overlay.js';

const FIELDS = [
  'emoji', 'title', 'ingredients', 'nutrition', 'micro', 'vitamins', 'energy', 'animal',
];

const BREED_LABELS = {
  small: 'Для малих порід · 300 г',
  large: 'Для середніх і великих порід · 300 г',
};

/** Модальне вікно з повним складом обраного смаку. */
export function initProductModal(root = document) {
  const overlay = qs('modal', root);
  const dialog = qs('modal-dialog', root);
  const breedEl = qs('modal-breed', root);
  if (!overlay || !dialog || !breedEl) return;

  const { open: show } = createOverlay({
    overlay,
    content: dialog,
    closers: [qs('modal-close', root)],
  });

  const slots = qsMap(FIELDS.map((f) => `modal-${f}`), root);

  const open = (flavor) => {
    const breed = currentBreed();
    const item = FULL[breed][flavor];
    if (!item) return;

    for (const field of FIELDS) {
      const slot = slots[`modal-${field}`];
      if (slot) slot.textContent = item[field];
    }
    breedEl.textContent = BREED_LABELS[breed];
    show();
  };

  qsa('open-composition', root).forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.flavor));
  });
}
