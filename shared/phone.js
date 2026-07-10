/**
 * Український мобільний номер: нормалізація, перевірка, маска.
 * Чисті функції, без DOM.
 *
 * Маска — лише зручність для користувача. Єдине джерело правди —
 * нормалізоване значення: рівно 12 цифр вигляду 380XXXXXXXXX.
 */

/**
 * Допустимі мобільні префікси. Це перевірка на існуючий український код,
 * а НЕ визначення оператора: в Україні діє перенесення номера (MNP),
 * тож код нічого не каже про поточного оператора.
 */
export const MOBILE_CODES = new Set([
  '067', '068', '096', '097', '098', '077', // Kyivstar
  '050', '066', '095', '099', '075',        // Vodafone
  '063', '073', '093',                      // lifecell
  '091',                                    // 3Mob
  '089', '092', '094',                      // інші мобільні коди
]);

const COUNTRY = '380';
const TOTAL_DIGITS = 12; // 380 + 9 цифр номера
const NATIONAL_DIGITS = 10; // 0XX + 7 цифр

/** Лише цифри: "+38 (067) 123-45-67" -> "380671234567". */
export const digitsOf = (value) => String(value ?? '').replace(/\D/g, '');

/**
 * Мобільний код разом із нулем: "380671234567" -> "067".
 * Повертає '' , якщо цифр замало.
 */
const codeOf = (digits) => digits.slice(2, 5);

/** Чи це коректний український мобільний номер. */
export function isValidPhone(value) {
  const digits = digitsOf(value);
  return (
    digits.length === TOTAL_DIGITS &&
    digits.startsWith(COUNTRY) &&
    MOBILE_CODES.has(codeOf(digits))
  );
}

/**
 * Причина відмови — для точного повідомлення користувачу.
 * @returns {'empty'|'length'|'country'|'code'|null}
 */
export function phoneProblem(value) {
  const digits = digitsOf(value);
  if (!digits) return 'empty';
  if (digits.length !== TOTAL_DIGITS) {
    // Номер без коду країни: 0XX + 7 цифр.
    return digits.length === NATIONAL_DIGITS && digits.startsWith('0')
      ? 'country'
      : 'length';
  }
  if (!digits.startsWith(COUNTRY)) return 'country';
  if (!MOBILE_CODES.has(codeOf(digits))) return 'code';
  return null;
}

/** Канонічний вигляд для передачі далі: "+380671234567". Інакше null. */
export function normalizePhone(value) {
  return isValidPhone(value) ? `+${digitsOf(value)}` : null;
}

/**
 * Національна частина номера (0XX + 7 цифр), не більше 10 цифр.
 *
 * Значення поля вже містить "+38(", тож digitsOf() завжди повертає "38" +
 * національна частина. Саме тому провідні "38" зрізаємо беззастережно —
 * інакше повторне форматування власного ж виводу псувало б його.
 */
export function nationalDigitsOf(value) {
  const digits = digitsOf(value);
  return digits.startsWith('38')
    ? digits.slice(2, 2 + NATIONAL_DIGITS)
    : digits.slice(0, NATIONAL_DIGITS);
}

/** Складає "+38(0XX)-XXX-XXXX" з національних цифр. Порожній ввід -> ''. */
export function formatNational(national) {
  if (!national) return '';

  let out = `+38(${national.slice(0, 3)}`;
  if (national.length >= 3) out += ')';
  if (national.length > 3) out += `-${national.slice(3, 6)}`;
  if (national.length > 6) out += `-${national.slice(6, 10)}`;
  return out;
}

/**
 * Маска вводу: "+38(0XX)-XXX-XXXX".
 * Порожній ввід повертає '' — щоб було видно placeholder.
 */
export const formatPhoneMask = (value) => formatNational(nationalDigitsOf(value));

/**
 * Нове значення поля після правки користувача.
 *
 * @param {string} valueAfterEdit  що лишилось у полі одразу після дії браузера
 * @param {{deleting?: boolean, previousValue?: string}} context
 *
 * Чому потрібен `deleting`: службові символи маски відновлюються за кількістю
 * цифр. Стерши ")" у "+38(067)", користувач не змінює жодної цифри — маска
 * дописує дужку назад, і поле залипає. Якщо після видалення формат збігся з
 * попереднім значенням, отже стерто лише службовий символ — знімаємо ще й цифру.
 */
export function maskAfterInput(valueAfterEdit, { deleting = false, previousValue = '' } = {}) {
  let national = nationalDigitsOf(valueAfterEdit);

  if (deleting && formatNational(national) === previousValue) {
    national = national.slice(0, -1);
  }

  return formatNational(national);
}
