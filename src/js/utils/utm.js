import { UTM_FIELDS, pickUtm } from '../../../shared/utm.js';

const STORAGE_KEY = 'pn:utm';

/**
 * UTM-мітки живуть довше за візит: людина приходить із реклами, читає
 * сторінку, повертається пізніше й лише тоді залишає заявку. Тому мітки
 * зберігаємо й підставляємо навіть тоді, коли в поточному URL їх уже немає.
 *
 * Якщо сховище недоступне (приватний режим, вимкнені куки), усе одно
 * працюємо: тримаємо мітки в пам'яті сторінки.
 */
let memoryFallback = {};

const readStorage = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? pickUtm(JSON.parse(raw)) : {};
  } catch {
    return memoryFallback;
  }
};

const writeStorage = (utm) => {
  memoryFallback = utm;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // Сховище недоступне — лишається пам'ять сторінки.
  }
};

/** UTM із поточної адреси. Порожній об'єкт, якщо їх немає. */
export function readUtmFromLocation(search = window.location.search) {
  const params = new URLSearchParams(search);
  const raw = {};
  for (const field of UTM_FIELDS) {
    const value = params.get(field);
    if (value !== null) raw[field] = value;
  }
  return pickUtm(raw);
}

/**
 * Викликається один раз на завантаженні сторінки.
 * Новий перехід із мітками повністю заміщує збережені: інакше поля
 * від різних кампаній змішалися б в одну неіснуючу.
 */
export function captureUtm() {
  const fromUrl = readUtmFromLocation();
  if (Object.keys(fromUrl).length > 0) writeStorage(fromUrl);
  return fromUrl;
}

/** Мітки для заявки: з поточної адреси або збережені раніше. */
export function getUtm() {
  const fromUrl = readUtmFromLocation();
  return Object.keys(fromUrl).length > 0 ? fromUrl : readStorage();
}
