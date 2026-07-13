import { Router } from 'express';

import {
  searchCities,
  searchWarehouses,
  NovaPoshtaNotConfiguredError,
  NovaPoshtaRequestError,
} from '../services/nova-poshta-service.js';
import { searchRateLimit } from '../middleware/rate-limit.js';
import { logApiEvent } from '../logger.js';

export const novaPoshtaRouter = Router();

const MIN_QUERY = 2;
const MAX_QUERY = 50;
const MAX_CITY_REF = 64;
const WAREHOUSE_TYPES = ['branch', 'postomat'];

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

/** Один обробник помилок довідника: назовні йде код, не деталі НП. */
function handleLookupError(req, res, error, event) {
  if (error instanceof NovaPoshtaNotConfiguredError) {
    logApiEvent('error', req, event, { status: 503, code: error.code });
    return res.status(503).json({ ok: false, code: error.code, message: error.message });
  }
  if (error instanceof NovaPoshtaRequestError) {
    logApiEvent('error', req, event, { status: 502, code: error.code, reason: error.reason });
    return res.status(502).json({ ok: false, code: error.code, message: error.message });
  }
  throw error;
}

novaPoshtaRouter.use(searchRateLimit);

// GET /api/nova-poshta/cities?q=ки
novaPoshtaRouter.get('/cities', async (req, res) => {
  const q = clean(req.query.q).slice(0, MAX_QUERY);
  if (q.length < MIN_QUERY) return res.json({ ok: true, data: [] });

  try {
    const data = await searchCities(q);
    logApiEvent('info', req, 'np_cities', { qlen: q.length, count: data.length });
    return res.json({ ok: true, data });
  } catch (error) {
    return handleLookupError(req, res, error, 'np_cities_failed');
  }
});

// GET /api/nova-poshta/warehouses?cityRef=...&type=branch|postomat&q=...
novaPoshtaRouter.get('/warehouses', async (req, res) => {
  const cityRef = clean(req.query.cityRef).slice(0, MAX_CITY_REF);
  const type = clean(req.query.type);
  const q = clean(req.query.q).slice(0, MAX_QUERY);

  if (!cityRef) {
    return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'Не вказано місто' });
  }
  if (!WAREHOUSE_TYPES.includes(type)) {
    return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'Невідомий тип точки видачі' });
  }

  try {
    const data = await searchWarehouses({ cityRef, type, query: q });
    logApiEvent('info', req, 'np_warehouses', { type, qlen: q.length, count: data.length });
    return res.json({ ok: true, data });
  } catch (error) {
    return handleLookupError(req, res, error, 'np_warehouses_failed');
  }
});
