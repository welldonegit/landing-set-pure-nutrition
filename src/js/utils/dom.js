/**
 * Пошук елементів за атрибутом data-js.
 * Розмітка чіпляється до скриптів тільки через нього — не через класи,
 * щоб перейменування класу не ламало логіку.
 */

/** Перший елемент з data-js="name" або null. */
export const qs = (name, root = document) =>
  root.querySelector(`[data-js="${name}"]`);

/** Усі елементи з data-js="name" як масив. */
export const qsa = (name, root = document) => [
  ...root.querySelectorAll(`[data-js="${name}"]`),
];

/** Кілька елементів за списком імен: qsAll(['a','b']) -> { a, b }. */
export const qsMap = (names, root = document) =>
  Object.fromEntries(names.map((name) => [name, qs(name, root)]));
