import { PRICE, REG_OFF, formatPrice, packSizes } from '../data/prices.js';
import { dailyGrams, lineForWeight } from '../data/feeding.js';

const FLAVORS = ['beef', 'turkey', 'salmon'];
const DAYS_PER_MONTH = 30;

/**
 * Підбір фасовки: найменша упаковка, що покриває місячну потребу.
 * Понад найбільшу — кратно їй плюс добірна упаковка на залишок.
 */
function choosePacks(kgPerMonth, sizes) {
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

export function initCalculator(root = document) {
  const slider = root.querySelector('[data-js="calc-weight-input"]');
  if (!slider) return;

  const out = Object.fromEntries(
    ['weight', 'daily', 'kg-month', 'cost', 'pack', 'per-kg', 'line'].map((k) => [
      k,
      root.querySelector(`[data-js="calc-${k}"]`),
    ]),
  );

  let weight = Number(slider.value);
  let flavor = 'beef';

  const render = () => {
    const daily = dailyGrams(weight);
    const kgPerMonth = (daily * DAYS_PER_MONTH) / 1000;

    const line = lineForWeight(weight);
    const priceMap = PRICE[line][flavor];
    const packs = choosePacks(kgPerMonth, packSizes(line, flavor));

    const boughtKg = packs.reduce((sum, s) => sum + s, 0);
    const fullCost = packs.reduce((sum, s) => sum + priceMap[s], 0);

    out.weight.textContent = String(weight);
    out.daily.textContent = String(daily);
    out['kg-month'].textContent = kgPerMonth.toFixed(1).replace('.', ',');
    out.cost.textContent = formatPrice(Math.round(fullCost * (1 - REG_OFF)));
    out['per-kg'].textContent = String(Math.round(fullCost / boughtKg));
    out.pack.textContent = `${packs.join(' + ')} кг`;
    out.line.textContent =
      line === 'small'
        ? 'Лінійка для малих порід'
        : 'Лінійка для середніх і великих';

    for (const f of FLAVORS) {
      root
        .querySelector(`[data-js="calc-flavor"][data-flavor="${f}"]`)
        ?.classList.toggle('is-active', f === flavor);
    }
  };

  slider.addEventListener('input', (e) => {
    weight = Number(e.target.value);
    render();
  });

  root.querySelectorAll('[data-js="calc-flavor"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      flavor = btn.dataset.flavor;
      render();
    });
  });

  render();
}
