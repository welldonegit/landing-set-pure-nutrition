import { qs, qsa } from '../utils/dom.js';
import { createAutocomplete } from './autocomplete.js';
import { fetchCities, fetchWarehouses } from '../api/nova-poshta.js';
import { validateDelivery } from '../../../shared/delivery.js';

const WAREHOUSE_LABELS = {
  branch: { label: 'Оберіть відділення', placeholder: 'Відділення: номер або адреса' },
  postomat: { label: 'Оберіть поштомат', placeholder: 'Поштомат: номер або адреса' },
};

// Стан на рівні модуля — форма читає його при відправленні.
const state = {
  type: 'branch',
  city: null, // { ref, name }
  address: '',
  warehouse: null, // { ref, name, number, shortAddress, type }
};

let dom = null;
let cityAc = null;
let warehouseAc = null;

/** Об'єкт delivery для payload. */
export function getDelivery() {
  const delivery = { type: state.type, city: state.city };
  if (state.type === 'doors') delivery.address = state.address.trim();
  else delivery.warehouse = state.warehouse;
  return delivery;
}

function setError(key, message) {
  const el = qs(`error-${key}`, dom.root);
  if (!el) return;
  el.textContent = message ?? '';
  el.hidden = !message;
}

function clearErrors() {
  ['delivery.type', 'delivery.city', 'delivery.address', 'delivery.warehouse'].forEach((k) =>
    setError(k, null),
  );
}

/** Показати помилки доставки. @returns {boolean} valid */
export function validateDeliveryUI() {
  clearErrors();
  const { valid, errors } = validateDelivery(getDelivery());
  for (const [key, message] of Object.entries(errors)) setError(key, message);
  return valid;
}

/** Скинути залежну від міста точку видачі. */
function resetWarehouse() {
  state.warehouse = null;
  warehouseAc?.reset();
}

function showFieldsForType() {
  const isDoors = state.type === 'doors';
  dom.addressField.hidden = !isDoors;
  dom.warehouseField.hidden = isDoors;

  if (!isDoors) {
    const cfg = WAREHOUSE_LABELS[state.type];
    dom.warehouseLabel.textContent = cfg.label;
    dom.warehouseInput.placeholder = cfg.placeholder;
    // Точку видачі можна шукати лише після вибору міста.
    warehouseAc.setEnabled(Boolean(state.city));
  }
}

function selectType(type) {
  if (type === state.type) return;
  state.type = type;

  dom.typeButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.type === type));

  // Зміна способу — чистимо залежні поля й старі помилки.
  state.address = '';
  dom.addressInput.value = '';
  resetWarehouse();
  clearErrors();
  showFieldsForType();
}

export function initDelivery(root = document) {
  const rootEl = qs('delivery', root);
  if (!rootEl) return;

  dom = {
    root: rootEl,
    typeButtons: qsa('delivery-type', rootEl),
    cityInput: qs('delivery-city', rootEl),
    cityList: qs('delivery-city-list', rootEl),
    addressField: qs('delivery-address-field', rootEl),
    addressInput: qs('delivery-address', rootEl),
    warehouseField: qs('delivery-warehouse-field', rootEl),
    warehouseInput: qs('delivery-warehouse', rootEl),
    warehouseList: qs('delivery-warehouse-list', rootEl),
    warehouseLabel: qs('delivery-warehouse-label', rootEl),
  };

  cityAc = createAutocomplete({
    input: dom.cityInput,
    list: dom.cityList,
    search: (q, signal) => fetchCities(q, signal),
    render: (c) => c.name,
    onSelect: (city) => {
      state.city = city ? { ref: city.ref, name: city.name } : null;
      setError('delivery.city', null);
      // Нове місто — стара точка видачі більше не дійсна.
      resetWarehouse();
      warehouseAc.setEnabled(Boolean(state.city) && state.type !== 'doors');
    },
  });

  warehouseAc = createAutocomplete({
    input: dom.warehouseInput,
    list: dom.warehouseList,
    search: (q, signal) => fetchWarehouses({ cityRef: state.city?.ref, type: state.type, query: q }, signal),
    render: (w) => w.name,
    onSelect: (w) => {
      state.warehouse = w
        ? { ref: w.ref, name: w.name, number: w.number, shortAddress: w.shortAddress, type: w.type }
        : null;
      setError('delivery.warehouse', null);
    },
  });

  dom.addressInput.addEventListener('input', () => {
    state.address = dom.addressInput.value;
    setError('delivery.address', null);
  });

  dom.typeButtons.forEach((btn) =>
    btn.addEventListener('click', () => selectType(btn.dataset.type)),
  );

  showFieldsForType();
}
