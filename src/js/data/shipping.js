/**
 * Правила відправки: замовлення до 16:00 їде того ж дня,
 * пізніше — наступного. У неділю не відправляємо.
 * Чисті функції: приймають поточний час, не читають годинник самі.
 */

const CUTOFF_HOUR = 16;

const WEEKDAY_ACC = [
  '', 'у понеділок', 'у вівторок', 'у середу',
  'у четвер', 'у п’ятницю', 'у суботу',
];

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** Момент найближчої відправки після `now`. */
export function nextShipment(now) {
  const end = new Date(now);
  end.setHours(CUTOFF_HOUR, 0, 0, 0);
  if (now >= end) end.setDate(end.getDate() + 1);
  while (end.getDay() === 0) end.setDate(end.getDate() + 1);
  return end;
}

/** Підпис на кшталт «Відправка завтра» / «Відправка у середу». */
export function shipmentLabel(now, end) {
  const diffDays = Math.round((startOfDay(end) - startOfDay(now)) / 86400000);
  if (diffDays <= 0) return 'Відправка сьогодні';
  if (diffDays === 1) return 'Відправка завтра';
  return `Відправка ${WEEKDAY_ACC[end.getDay()]}`;
}

/** Скільки секунд лишилось до відправки. */
export const secondsUntil = (now, end) => Math.floor((end - now) / 1000);
