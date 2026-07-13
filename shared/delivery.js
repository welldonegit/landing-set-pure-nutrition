/**
 * Спосіб доставки: спільні константи, перевірка форми об'єкта та
 * людський рядок для Telegram/KeyCRM. Чисті функції, без DOM і без мережі.
 *
 * Це лише перевірка структури. Належність відділення обраному місту й типу
 * сервер додатково звіряє з Новою Поштою (див. server/routes/leads.js).
 */

export const DELIVERY_TYPES = ['doors', 'branch', 'postomat'];

export const DELIVERY_LABELS = {
  doors: 'До дверей',
  branch: 'На відділення',
  postomat: 'На поштомат',
};

export const DELIVERY_LIMITS = {
  ref: 64,
  name: 200,
  number: 20,
  address: 200,
};

const str = (v) => (typeof v === 'string' ? v : '');
const tooLong = (v, max) => str(v).length > max;

/**
 * Перевірка форми об'єкта delivery.
 * @returns {{ valid: boolean, errors: Record<string,string> }}
 *          ключі помилок: delivery.type | delivery.city | delivery.address | delivery.warehouse
 */
export function validateDelivery(delivery) {
  const errors = {};

  if (!delivery || typeof delivery !== 'object' || Array.isArray(delivery)) {
    return { valid: false, errors: { 'delivery.type': 'Оберіть спосіб доставки' } };
  }

  const { type, city, address, warehouse } = delivery;

  if (!DELIVERY_TYPES.includes(type)) {
    errors['delivery.type'] = 'Оберіть спосіб доставки';
  }

  // Місто обов'язкове для всіх способів.
  const cityOk =
    city && typeof city === 'object' && str(city.ref).trim() && str(city.name).trim();
  if (!cityOk) {
    errors['delivery.city'] = 'Оберіть місто зі списку';
  } else if (tooLong(city.ref, DELIVERY_LIMITS.ref) || tooLong(city.name, DELIVERY_LIMITS.name)) {
    errors['delivery.city'] = 'Некоректне місто';
  }

  if (type === 'doors') {
    if (str(address).trim().length < 4) {
      errors['delivery.address'] = 'Вкажіть адресу доставки';
    } else if (tooLong(address, DELIVERY_LIMITS.address)) {
      errors['delivery.address'] = 'Задовга адреса';
    }
  } else if (type === 'branch' || type === 'postomat') {
    const whOk = warehouse && typeof warehouse === 'object' && str(warehouse.ref).trim();
    if (!whOk) {
      errors['delivery.warehouse'] =
        type === 'branch' ? 'Оберіть відділення зі списку' : 'Оберіть поштомат зі списку';
    } else if (
      tooLong(warehouse.ref, DELIVERY_LIMITS.ref) ||
      tooLong(warehouse.name, DELIVERY_LIMITS.name) ||
      tooLong(warehouse.number, DELIVERY_LIMITS.number)
    ) {
      errors['delivery.warehouse'] = 'Некоректна точка видачі';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Людський опис доставки одним рядком або кількома — для менеджера. */
export function describeDelivery(delivery) {
  if (!delivery) return '';
  const label = DELIVERY_LABELS[delivery.type] ?? delivery.type;
  const city = delivery.city?.name ?? '';

  if (delivery.type === 'doors') {
    return `${label}, ${city}, ${str(delivery.address).trim()}`;
  }
  const w = delivery.warehouse ?? {};
  const point = str(w.name).trim() || (w.number ? `№${w.number}` : '');
  const short = str(w.shortAddress).trim();
  return `${label}, ${city}, ${point}${short ? ` (${short})` : ''}`;
}
