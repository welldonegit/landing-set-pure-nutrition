import { REVIEWS } from '../data/reviews.js';
import { qs, qsa } from '../utils/dom.js';
import { createOverlay } from '../utils/overlay.js';

/**
 * Повноекранний перегляд скріншотів відгуків.
 * Повертає { open(index) } або null, якщо розмітки на сторінці немає.
 */
export function createLightbox(root = document) {
  const overlay = qs('lightbox', root);
  const stage = qs('lightbox-stage', root);
  const image = qs('lightbox-image', root);
  const position = qs('lightbox-position', root);
  if (!overlay || !stage || !image || !position) return null;

  const { open: show } = createOverlay({
    overlay,
    content: stage,
    closers: [qs('lightbox-close', root)],
  });

  let index = 0;

  const open = (i) => {
    index = (i + REVIEWS.length) % REVIEWS.length;
    image.src = REVIEWS[index];
    position.textContent = String(index + 1);
    show();
  };

  // Стрілки лежать поза stage, тож клік по них дійшов би до тла і закрив шар.
  const step = (delta) => (e) => {
    e.stopPropagation();
    open(index + delta);
  };

  qs('lightbox-prev', root)?.addEventListener('click', step(-1));
  qs('lightbox-next', root)?.addEventListener('click', step(1));

  qsa('reviews-count', root).forEach((el) => {
    el.textContent = String(REVIEWS.length);
  });

  return { open };
}
