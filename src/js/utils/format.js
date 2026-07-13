/** Нерозривний пробіл як роздільник тисяч: 2164 -> "2 164". */
export function formatPrice(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Двозначне число з провідним нулем: 7 -> "07". */
export const pad2 = (n) => String(n).padStart(2, '0');

/** Десяткова кома замість крапки: 3.9 -> "3,9". */
export const decimalComma = (n, digits = 1) =>
  n.toFixed(digits).replace('.', ',');
