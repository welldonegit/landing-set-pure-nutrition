const WEEKDAY_ACC = [
  '', 'у понеділок', 'у вівторок', 'у середу',
  'у четвер', 'у п’ятницю', 'у суботу',
];

const CUTOFF_HOUR = 16;

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * Найближча відправка: сьогодні до 16:00, інакше наступного дня.
 * Неділя пропускається — переносимо на понеділок.
 */
function nextShipment(now) {
  const end = new Date(now);
  end.setHours(CUTOFF_HOUR, 0, 0, 0);
  if (now >= end) end.setDate(end.getDate() + 1);
  while (end.getDay() === 0) end.setDate(end.getDate() + 1);
  return end;
}

function shipLabel(now, end) {
  const diffDays = Math.round((startOfDay(end) - startOfDay(now)) / 86400000);
  if (diffDays <= 0) return 'Відправка сьогодні';
  if (diffDays === 1) return 'Відправка завтра';
  return `Відправка ${WEEKDAY_ACC[end.getDay()]}`;
}

const pad = (n) => String(n).padStart(2, '0');

export function initCountdown(root = document) {
  const hEl = root.querySelector('[data-js="timer-hours"]');
  const mEl = root.querySelector('[data-js="timer-minutes"]');
  const sEl = root.querySelector('[data-js="timer-seconds"]');
  const labelEl = root.querySelector('[data-js="ship-label"]');
  if (!hEl || !mEl || !sEl || !labelEl) return;

  const tick = () => {
    const now = new Date();
    const end = nextShipment(now);
    const left = Math.floor((end - now) / 1000);

    hEl.textContent = pad(Math.floor(left / 3600));
    mEl.textContent = pad(Math.floor((left % 3600) / 60));
    sEl.textContent = pad(left % 60);
    labelEl.textContent = shipLabel(now, end);
  };

  tick();
  setInterval(tick, 1000);
}
