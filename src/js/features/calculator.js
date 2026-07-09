import { estimateMonthly } from '../data/pricing.js';
import { qs, qsa, qsMap } from '../utils/dom.js';
import { formatPrice, decimalComma } from '../utils/format.js';

const OUTPUTS = [
  'calc-weight', 'calc-daily', 'calc-kg-month',
  'calc-cost', 'calc-pack', 'calc-per-kg', 'calc-line',
];

const LINE_LABELS = {
  small: 'Лінійка для малих порід',
  large: 'Лінійка для середніх і великих',
};

/** Калькулятор годування: повзунок ваги + вибір смаку. */
export function initCalculator(root = document) {
  const slider = qs('calc-weight-input', root);
  if (!slider) return;

  const out = qsMap(OUTPUTS, root);
  const flavorButtons = qsa('calc-flavor', root);

  let weight = Number(slider.value);
  let flavor = 'beef';

  const render = () => {
    const result = estimateMonthly(weight, flavor);

    out['calc-weight'].textContent = String(weight);
    out['calc-daily'].textContent = String(result.daily);
    out['calc-kg-month'].textContent = decimalComma(result.kgPerMonth);
    out['calc-cost'].textContent = formatPrice(result.discountedCost);
    out['calc-per-kg'].textContent = String(result.perKg);
    out['calc-pack'].textContent = `${result.packs.join(' + ')} кг`;
    out['calc-line'].textContent = LINE_LABELS[result.line];

    flavorButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.flavor === flavor);
    });
  };

  slider.addEventListener('input', (e) => {
    weight = Number(e.target.value);
    render();
  });

  flavorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      flavor = btn.dataset.flavor;
      render();
    });
  });

  render();
}
