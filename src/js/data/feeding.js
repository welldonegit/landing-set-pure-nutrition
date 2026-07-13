/**
 * Норма годування «Підтримання ваги»: [вага собаки, кг] -> [грамів на добу].
 * Між вузлами таблиці значення інтерполюється лінійно.
 */
const FEED = [
  [2, 60], [3, 70], [4, 80], [5, 90], [6, 100], [8, 110], [10, 130],
  [12, 170], [15, 190], [17, 220], [20, 240], [22, 260], [25, 280],
  [30, 320], [40, 390], [50, 460], [60, 530], [70, 590], [80, 650],
];

/** Добова норма в грамах для собаки вагою `weight` кг. */
export function dailyGrams(weight) {
  if (weight <= FEED[0][0]) return FEED[0][1];
  if (weight >= FEED[FEED.length - 1][0]) return FEED[FEED.length - 1][1];

  for (let i = 0; i < FEED.length - 1; i++) {
    const [w0, g0] = FEED[i];
    const [w1, g1] = FEED[i + 1];
    if (weight >= w0 && weight <= w1) {
      return Math.round(g0 + ((g1 - g0) * (weight - w0)) / (w1 - w0));
    }
  }
  return FEED[FEED.length - 1][1];
}

/** Лінійку добираємо за вагою: до 10 кг — малі породи, більше — середні та великі. */
export function lineForWeight(weight) {
  return weight <= 10 ? 'small' : 'large';
}
