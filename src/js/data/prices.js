/**
 * Ціни за упаковку, грн. Єдине джерело правди:
 * прайс-таблиця і калькулятор читають звідси.
 */
export const PRICE = {
  large: {
    // фасування 1 / 5 / 10 кг
    salmon: { 1: 541, 5: 2164, 10: 4058 },
    turkey: { 1: 445, 5: 1780, 10: 3338 },
    beef: { 1: 447, 5: 1788, 10: 3353 },
  },
  small: {
    // фасування 1 / 3 / 5 кг (10 кг не передбачено)
    salmon: { 1: 573, 3: 1547, 5: 2292 },
    turkey: { 1: 497, 3: 1342, 5: 1988 },
    beef: { 1: 535, 3: 1445, 5: 2140 },
  },
};

/** Знижка для зареєстрованих на сайті. */
export const REG_OFF = 0.1;

/** Вартість апселу (смаколики), грн. */
export const TREAT_PRICE = 220;

/**
 * Ціни й підписи наборів для відображення в блоці замовлення.
 * Ключ збігається з <option> селекта розміру (і з server/config/products.js).
 * price — актуальна ціна, oldPrice — закреслена.
 */
export const SIZE_OPTIONS = {
  'Дрібна порода (сет 3×300 г)': {
    price: 495,
    oldPrice: 550,
    setLabel: 'Дегустаційний сет: 3×300 г, 3 смаки',
  },
  'Середня / велика порода (сет 3×1 кг)': {
    price: 1289,
    oldPrice: 1432,
    setLabel: 'Набір: 3×1 кг, 3 смаки',
  },
};

export const DEFAULT_SIZE = 'Дрібна порода (сет 3×300 г)';

/** Порядок і підписи рядків прайс-таблиці. */
export const PRICE_ROWS = [
  { flavor: 'salmon', emoji: '🐟', name: 'Делікатний лосось' },
  { flavor: 'turkey', emoji: '🦃', name: 'Ніжна індичка' },
  { flavor: 'beef', emoji: '🥩', name: 'Соковита яловичина' },
];

/** Фасування лінійки за зростанням: small -> [1,3,5], large -> [1,5,10]. */
export function packSizes(line, flavor) {
  return Object.keys(PRICE[line][flavor])
    .map(Number)
    .sort((a, b) => a - b);
}
