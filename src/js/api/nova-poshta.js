/**
 * Клієнт до власних endpoints довідників. У Нову Пошту напряму не ходимо —
 * лише на свій backend, який ховає ключ і нормалізує відповідь.
 */

async function get(url, signal) {
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) {
    const error = new Error(body?.message || 'Довідник недоступний');
    error.code = body?.code;
    throw error;
  }
  return body.data ?? [];
}

/** Пошук міст. @returns {Promise<Array<{ref,name}>>} */
export function fetchCities(query, signal) {
  return get(`/api/nova-poshta/cities?q=${encodeURIComponent(query)}`, signal);
}

/** Пошук відділень або поштоматів обраного міста. */
export function fetchWarehouses({ cityRef, type, query }, signal) {
  const params = new URLSearchParams({ cityRef, type, q: query ?? '' });
  return get(`/api/nova-poshta/warehouses?${params}`, signal);
}
