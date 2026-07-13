import { REVIEWS } from '../data/reviews.js';
import { qs, qsa } from '../utils/dom.js';
import { createLightbox } from './lightbox.js';

const REVIEW_ALT = 'Відгук клієнта Pure Nutrition';
const REVIEW_ITEMS = REVIEWS.map((src) => ({ src, alt: REVIEW_ALT }));

function buildTile(src, onOpen) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'reviews__tile';
  tile.setAttribute('aria-label', 'Відкрити відгук');

  const img = document.createElement('img');
  img.className = 'reviews__tile-image';
  img.src = src;
  img.alt = REVIEW_ALT;
  img.loading = 'lazy';

  tile.append(img);
  tile.addEventListener('click', onOpen);
  return tile;
}

/** Мобільна мозаїка скріншотів; тап відкриває повноекранну галерею. */
export function initReviewsGallery(root = document) {
  const grid = qs('reviews-grid', root);
  const lightbox = createLightbox(root);
  if (!grid || !lightbox) return;

  // Лічильник у підказці «… N відгуків» — саме відгуки, не спільна галерея.
  qsa('reviews-count', root).forEach((el) => {
    el.textContent = String(REVIEWS.length);
  });

  grid.append(
    ...REVIEWS.map((src, i) => buildTile(src, () => lightbox.open(REVIEW_ITEMS, i))),
  );
}
