import { REVIEWS } from '../data/reviews.js';

/** Мобільна мозаїка скріншотів + повноекранна галерея. */
export function initReviewsGallery(root = document) {
  const grid = root.querySelector('[data-js="reviews-grid"]');
  const overlay = root.querySelector('[data-js="lightbox"]');
  const stage = root.querySelector('[data-js="lightbox-stage"]');
  const image = root.querySelector('[data-js="lightbox-image"]');
  const position = root.querySelector('[data-js="lightbox-position"]');
  if (!grid || !overlay || !stage || !image || !position) return;

  let index = 0;

  const show = (i) => {
    index = (i + REVIEWS.length) % REVIEWS.length;
    image.src = REVIEWS[index];
    position.textContent = String(index + 1);
    overlay.style.display = 'flex';
  };

  const close = () => {
    overlay.style.display = 'none';
  };

  REVIEWS.forEach((src, i) => {
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
    tile.addEventListener('click', () => show(i));
    grid.append(tile);
  });

  root.querySelectorAll('[data-js="reviews-count"]').forEach((el) => {
    el.textContent = String(REVIEWS.length);
  });

  overlay.addEventListener('click', close);
  stage.addEventListener('click', (e) => e.stopPropagation());
  root.querySelector('[data-js="lightbox-close"]')?.addEventListener('click', close);

  root.querySelector('[data-js="lightbox-prev"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    show(index - 1);
  });
  root.querySelector('[data-js="lightbox-next"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    show(index + 1);
  });
}
