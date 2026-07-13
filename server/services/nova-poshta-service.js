import { config } from '../config/env.js';

/**
 * Довідники Нової Пошти: міста (autocomplete) та відділення/поштомати.
 *
 * Ключ береться лише з config і не потрапляє ні в бандл, ні в логи, ні в
 * відповідь клієнту. Назовні віддаємо тільки потрібні поля, а не сирий
 * об'єкт НП. ТТН тут не створюємо — жодних методів InternetDocument.
 */

const REQUEST_TIMEOUT_MS = 9_000;
const CITIES_TTL_MS = 15 * 60 * 1000;
const WAREHOUSES_TTL_MS = 45 * 60 * 1000;

// Офіційне поле категорії складу. Поштомат визначаємо по ньому,
// а не по слову «Поштомат» у назві.
const POSTOMAT_CATEGORY = 'Postomat';

export class NovaPoshtaNotConfiguredError extends Error {
  constructor() {
    super('Довідник доставки тимчасово недоступний');
    this.name = 'NovaPoshtaNotConfiguredError';
    this.code = 'NOVA_POSHTA_NOT_CONFIGURED';
  }
}

export class NovaPoshtaRequestError extends Error {
  constructor(reason) {
    super('Довідник доставки тимчасово недоступний');
    this.name = 'NovaPoshtaRequestError';
    this.code = 'NOVA_POSHTA_UNAVAILABLE';
    this.reason = reason ?? 'unknown';
  }
}

export const isNovaPoshtaConfigured = () => config.novaPoshta.configured;

// ── простий in-memory кеш із TTL ────────────────────────────────────────
const cache = new Map();

function cached(key, ttl, produce) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  return produce().then((value) => {
    cache.set(key, { value, expires: Date.now() + ttl });
    return value;
  });
}

async function npRequest(modelName, calledMethod, methodProperties) {
  if (!isNovaPoshtaConfigured()) throw new NovaPoshtaNotConfiguredError();

  let response;
  try {
    response = await fetch(config.novaPoshta.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: config.novaPoshta.apiKey,
        modelName,
        calledMethod,
        methodProperties,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? 'timeout' : `network:${error?.name ?? 'Error'}`;
    throw new NovaPoshtaRequestError(reason);
  }

  if (!response.ok) throw new NovaPoshtaRequestError(`http:${response.status}`);

  const body = await response.json().catch(() => null);
  if (!body || body.success !== true) throw new NovaPoshtaRequestError('api:not_success');

  return Array.isArray(body.data) ? body.data : [];
}

/**
 * Autocomplete міст. Ref = CityRef, придатний для пошуку складів.
 * @returns {Promise<Array<{ref:string, name:string}>>}
 */
export async function searchCities(query, limit = 10) {
  const q = query.trim();
  return cached(`cities:${q.toLowerCase()}:${limit}`, CITIES_TTL_MS, async () => {
    const rows = await npRequest('Address', 'getCities', { FindByString: q, Limit: limit });
    return rows.map((c) => ({ ref: c.Ref, name: c.Description }));
  });
}

const toWarehouseType = (row) =>
  row.CategoryOfWarehouse === POSTOMAT_CATEGORY ? 'postomat' : 'branch';

/**
 * Відділення або поштомати обраного міста.
 * Тип визначається офіційним полем CategoryOfWarehouse і фільтрується сервером.
 * @returns {Promise<Array<{ref,name,cityRef,number,shortAddress,type}>>}
 */
export async function searchWarehouses({ cityRef, type, query = '', limit = 20 }) {
  const q = query.trim();
  const key = `wh:${cityRef}:${type}:${q.toLowerCase()}:${limit}`;

  return cached(key, WAREHOUSES_TTL_MS, async () => {
    const rows = await npRequest('Address', 'getWarehouses', {
      CityRef: cityRef,
      FindByString: q,
      Limit: limit,
      Page: 1,
    });

    return rows
      .map((w) => ({
        ref: w.Ref,
        name: w.Description,
        cityRef: w.CityRef,
        number: w.Number,
        shortAddress: w.ShortAddress,
        type: toWarehouseType(w),
      }))
      .filter((w) => w.type === type);
  });
}

/**
 * Чи належить точка видачі обраному місту й типу.
 * Захист від підробленого warehouseRef (іншого міста або типу).
 * Кидає NovaPoshtaRequestError, якщо НП недоступна — рішення за викликачем.
 * @returns {Promise<boolean>}
 */
export async function verifyWarehouse({ cityRef, type, ref, number }) {
  const list = await searchWarehouses({ cityRef, type, query: number || '', limit: 50 });
  return list.some((w) => w.ref === ref);
}

/** Скидання кешу — лише для тестів. */
export const _clearCache = () => cache.clear();
