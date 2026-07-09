import { PRICE, PRICE_ROWS, formatPrice, packSizes } from '../data/prices.js';

const ROW_STYLE =
  'display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;border-top:1px solid #f1f0ea;align-items:center';
const NAME_STYLE =
  "display:flex;align-items:center;gap:8px;font:700 14px 'Montserrat';color:#3a3a34;padding:14px 16px";

// Колонки з цінами: перша приглушена, остання — акцентна.
const CELL_STYLES = [
  "font:600 14px 'Montserrat';color:#8a8d86;padding:14px 8px;text-align:right;font-variant-numeric:tabular-nums",
  "font:600 14px 'Montserrat';color:#5c5f58;padding:14px 8px;text-align:right;font-variant-numeric:tabular-nums",
  "font:800 14px 'Montserrat';color:#15140f;padding:14px 16px 14px 8px;text-align:right;font-variant-numeric:tabular-nums",
];

function buildRow(line, { flavor, emoji, name }) {
  const row = document.createElement('div');
  row.setAttribute('style', ROW_STYLE);

  const nameCell = document.createElement('div');
  nameCell.setAttribute('style', NAME_STYLE);
  const emojiEl = document.createElement('span');
  emojiEl.setAttribute('style', 'font-size:16px');
  emojiEl.textContent = emoji;
  nameCell.append(emojiEl, name);
  row.append(nameCell);

  packSizes(line, flavor).forEach((size, i) => {
    const cell = document.createElement('div');
    cell.setAttribute('style', CELL_STYLES[i]);
    cell.textContent = formatPrice(PRICE[line][flavor][size]);
    row.append(cell);
  });

  return row;
}

export function initPriceTable(root = document) {
  for (const line of ['large', 'small']) {
    const body = root.querySelector(`[data-js="price-rows"][data-line="${line}"]`);
    if (!body) continue;
    body.append(...PRICE_ROWS.map((row) => buildRow(line, row)));
  }
}
