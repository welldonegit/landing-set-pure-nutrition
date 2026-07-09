import { PRICE, REG_OFF, packSizes } from './prices.js';
import { dailyGrams, lineForWeight } from './feeding.js';

const DAYS_PER_MONTH = 30;
const GRAMS_PER_KG = 1000;

/**
 * Підбір фасовки: найменша упаковка, що покриває місячну потребу.
 * Понад найбільшу — кратно їй плюс добірна упаковка на залишок.
 */
export function choosePacks(kgPerMonth, sizes) {
  const maxSize = sizes[sizes.length - 1];
  if (kgPerMonth <= maxSize) {
    return [sizes.find((s) => s >= kgPerMonth) || maxSize];
  }

  const whole = Math.floor(kgPerMonth / maxSize);
  const packs = Array(whole).fill(maxSize);
  const rest = kgPerMonth - whole * maxSize;
  if (rest > 0.001) packs.push(sizes.find((s) => s >= rest) || maxSize);
  return packs;
}

/**
 * Місячний розрахунок для собаки вагою `weight` кг і смаку `flavor`.
 * Чиста функція: жодного DOM, лише дані.
 */
export function estimateMonthly(weight, flavor) {
  const daily = dailyGrams(weight);
  const kgPerMonth = (daily * DAYS_PER_MONTH) / GRAMS_PER_KG;

  const line = lineForWeight(weight);
  const priceMap = PRICE[line][flavor];
  const packs = choosePacks(kgPerMonth, packSizes(line, flavor));

  const boughtKg = packs.reduce((sum, size) => sum + size, 0);
  const fullCost = packs.reduce((sum, size) => sum + priceMap[size], 0);

  return {
    daily,
    kgPerMonth,
    line,
    packs,
    fullCost,
    // Ціна, яку бачить користувач, уже враховує знижку за реєстрацію.
    discountedCost: Math.round(fullCost * (1 - REG_OFF)),
    perKg: Math.round(fullCost / boughtKg),
  };
}
