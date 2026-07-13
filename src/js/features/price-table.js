import { PRICE, PRICE_ROWS, packSizes } from '../data/prices.js';
import { formatPrice } from '../utils/format.js';

// Колонки з цінами: перша приглушена, остання — акцентна.
const CELL_MODIFIERS = ['muted', 'regular', 'strong'];

function buildRow(line, { flavor, emoji, name }) {
  const row = document.createElement('div');
  row.className = 'price-table__row';

  const nameCell = document.createElement('div');
  nameCell.className = 'price-table__name';
  const emojiEl = document.createElement('span');
  emojiEl.className = 'price-table__emoji';
  emojiEl.textContent = emoji;
  nameCell.append(emojiEl, name);
  row.append(nameCell);

  packSizes(line, flavor).forEach((size, i) => {
    const cell = document.createElement('div');
    cell.className = `price-table__cell price-table__cell--${CELL_MODIFIERS[i]}`;
    cell.textContent = formatPrice(PRICE[line][flavor][size]);
    row.append(cell);
  });

  return row;
}

/** Дві таблиці цін: для великих і для малих порід. */
export function initPriceTable(root = document) {
  for (const line of ['large', 'small']) {
    const body = root.querySelector(`[data-js="price-rows"][data-line="${line}"]`);
    if (!body) continue;
    body.append(...PRICE_ROWS.map((row) => buildRow(line, row)));
  }
}
