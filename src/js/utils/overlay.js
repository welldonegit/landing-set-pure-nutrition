/**
 * Спільна поведінка модального шару: клік по тлу закриває,
 * клік усередині вмісту — ні. Видимістю керує inline-стиль display,
 * бо в CSS базовий стан шару — display: none.
 *
 * Опції escapeToClose, lockScroll та onKeydown вимкнені за замовчуванням —
 * наявні шари (модалка складу) поводяться як раніше.
 */
export function createOverlay({
  overlay,
  content,
  closers = [],
  display = 'flex',
  escapeToClose = false,
  lockScroll = false,
  onKeydown,
}) {
  const handleKey = (event) => {
    if (escapeToClose && event.key === 'Escape') {
      close();
      return;
    }
    onKeydown?.(event);
  };

  const open = () => {
    overlay.style.display = display;
    if (lockScroll) document.body.style.overflow = 'hidden';
    // Слухач лише поки шар відкрито — знімається в close().
    document.addEventListener('keydown', handleKey);
  };

  const close = () => {
    overlay.style.display = 'none';
    if (lockScroll) document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKey);
  };

  overlay.addEventListener('click', close);
  content?.addEventListener('click', (e) => e.stopPropagation());
  closers.forEach((el) => el?.addEventListener('click', close));

  return { open, close };
}
