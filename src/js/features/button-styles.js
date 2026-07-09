/**
 * Інлайнові стилі кнопок, що залежать від стану.
 * Тимчасово живуть у JS — як і решта інлайнових стилів сторінки.
 * Виносяться у CSS-класи на наступному етапі рефакторингу.
 */

/** Сегментований перемикач лінійки (малі / середні та великі породи). */
export const segOff =
  "border:0;background:transparent;font:800 15px 'Montserrat';color:#8a8d86;padding:11px 22px;border-radius:99px;cursor:pointer;transition:.15s";
export const segOn =
  "border:0;font:800 15px 'Montserrat';color:#15140f;padding:11px 22px;border-radius:99px;cursor:pointer;background:#a3ce2e;transition:.15s";

/** Спосіб оплати. */
export const payOff =
  "flex:1;border:1px solid #ebeae3;background:#fafaf8;font:700 14px 'Montserrat';color:#8a8d86;padding:13px 10px;border-radius:12px;cursor:pointer;transition:.15s";
export const payOn =
  "flex:1;border:2px solid #a3ce2e;background:#f1f7e3;font:800 14px 'Montserrat';color:#15140f;padding:12px 10px;border-radius:12px;cursor:pointer;transition:.15s";

/** Вибір смаку в калькуляторі. */
export function flavorBtn(active) {
  return active
    ? "display:flex;align-items:center;gap:10px;border:2px solid #a3ce2e;background:#f1f7e3;font:800 15px 'Montserrat';color:#15140f;padding:13px 16px;border-radius:14px;cursor:pointer;text-align:left;transition:.15s"
    : "display:flex;align-items:center;gap:10px;border:1px solid #ebeae3;background:#fafaf8;font:700 15px 'Montserrat';color:#5c5f58;padding:14px 16px;border-radius:14px;cursor:pointer;text-align:left;transition:.15s";
}
