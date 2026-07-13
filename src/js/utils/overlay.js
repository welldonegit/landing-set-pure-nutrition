/**
 * Спільна поведінка модального шару: клік по тлу закриває,
 * клік усередині вмісту — ні. Видимістю керує inline-стиль display,
 * бо в CSS базовий стан шару — display: none.
 */
export function createOverlay({ overlay, content, closers = [], display = 'flex' }) {
  const open = () => {
    overlay.style.display = display;
  };

  const close = () => {
    overlay.style.display = 'none';
  };

  overlay.addEventListener('click', close);
  content?.addEventListener('click', (e) => e.stopPropagation());
  closers.forEach((el) => el?.addEventListener('click', close));

  return { open, close };
}
