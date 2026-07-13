import { qs, qsa } from '../utils/dom.js';
import { createOverlay } from '../utils/overlay.js';

/**
 * Повноекранна галерея зображень. Одна на сторінку — розмітку ділять і
 * відгуки, і сертифікати. Колекція передається в open(), тож другої
 * реалізації не потрібно.
 *
 * @typedef {{ src: string, alt: string }} GalleryItem
 * @returns {{ open: (items: GalleryItem[], start?: number) => void } | null}
 */
let shared = null;

export function createLightbox(root = document) {
  if (shared) return shared;

  const overlay = qs('lightbox', root);
  const stage = qs('lightbox-stage', root);
  const image = qs('lightbox-image', root);
  const position = qs('lightbox-position', root);
  const total = qs('lightbox-total', root);
  if (!overlay || !stage || !image || !position) return null;

  let items = [];
  let index = 0;

  const render = () => {
    const item = items[index];
    if (!item) return;
    image.src = item.src;
    image.alt = item.alt;
    position.textContent = String(index + 1);
    if (total) total.textContent = String(items.length);
  };

  const step = (delta) => (event) => {
    event?.stopPropagation();
    if (items.length === 0) return;
    index = (index + delta + items.length) % items.length;
    render();
  };

  const { open: show } = createOverlay({
    overlay,
    content: stage,
    closers: [qs('lightbox-close', root)],
    escapeToClose: true,
    lockScroll: true,
    onKeydown: (event) => {
      if (event.key === 'ArrowLeft') step(-1)(event);
      else if (event.key === 'ArrowRight') step(1)(event);
    },
  });

  // Стрілки лежать поза stage, тож клік по них дійшов би до тла і закрив шар.
  qs('lightbox-prev', root)?.addEventListener('click', step(-1));
  qs('lightbox-next', root)?.addEventListener('click', step(1));

  const open = (list, start = 0) => {
    if (!Array.isArray(list) || list.length === 0) return;
    items = list;
    index = ((start % list.length) + list.length) % list.length;
    render();
    show();
  };

  shared = { open };
  return shared;
}
