import { qs } from '../utils/dom.js';

/** Десктопна стрічка відгуків: прокрутка на ~85% ширини видимої області. */
const STEP_RATIO = 0.85;

export function initReviewsSlider(root = document) {
  const track = qs('reviews-track', root);
  const prev = qs('reviews-prev', root);
  const next = qs('reviews-next', root);
  if (!track || !prev || !next) return;

  const scrollBy = (direction) =>
    track.scrollBy({
      left: direction * Math.round(track.clientWidth * STEP_RATIO),
      behavior: 'smooth',
    });

  prev.addEventListener('click', () => scrollBy(-1));
  next.addEventListener('click', () => scrollBy(1));
}
