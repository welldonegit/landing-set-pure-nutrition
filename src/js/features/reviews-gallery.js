import { REVIEWS } from '../data/reviews.js';

const TILE_STYLE =
  'padding:0;border:1px solid #ebeae3;border-radius:10px;overflow:hidden;background:#faf9f5;cursor:pointer;display:block;scroll-snap-align:start';
const TILE_IMG_STYLE = 'width:100%;height:100%;object-fit:cover;display:block';

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
    tile.setAttribute('aria-label', 'Відкрити відгук');
    tile.setAttribute('style', TILE_STYLE);

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Відгук клієнта Pure Nutrition';
    img.loading = 'lazy';
    img.setAttribute('style', TILE_IMG_STYLE);

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
