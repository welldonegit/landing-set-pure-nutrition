import { nextShipment, shipmentLabel, secondsUntil } from '../data/shipping.js';
import { qsMap } from '../utils/dom.js';
import { pad2 } from '../utils/format.js';

const TICK_MS = 1000;

/** Зворотний відлік до найближчої відправки. */
export function initCountdown(root = document) {
  const el = qsMap(
    ['timer-hours', 'timer-minutes', 'timer-seconds', 'ship-label'],
    root,
  );
  if (Object.values(el).some((node) => !node)) return;

  const tick = () => {
    const now = new Date();
    const end = nextShipment(now);
    const left = secondsUntil(now, end);

    el['timer-hours'].textContent = pad2(Math.floor(left / 3600));
    el['timer-minutes'].textContent = pad2(Math.floor((left % 3600) / 60));
    el['timer-seconds'].textContent = pad2(left % 60);
    el['ship-label'].textContent = shipmentLabel(now, end);
  };

  tick();
  setInterval(tick, TICK_MS);
}
