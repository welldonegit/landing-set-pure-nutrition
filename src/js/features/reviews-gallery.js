import { REVIEWS } from '../data/reviews.js';
import { qs } from '../utils/dom.js';
import { createLightbox } from './lightbox.js';

function buildTile(src, onOpen) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'reviews__tile';
  tile.setAttribute('aria-label', 'Відкрити відгук');

  const img = document.createElement('img');
  img.className = 'reviews__tile-image';
  img.src = src;
  img.alt = 'Відгук клієнта Pure Nutrition';
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

  grid.append(
    ...REVIEWS.map((src, i) => buildTile(src, () => lightbox.open(i))),
  );
}
