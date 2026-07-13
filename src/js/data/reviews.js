/** Порядок скріншотів у мобільній мозаїці та повноекранній галереї. */
const FILES = [
  'r04', 'r17', 'r08', 'r11', 'r02', 'r07', 'r05', 'r12', 'r18',
  'r09', 'r01', 'r06', 'r13', 'r15', 'r10', 'r03', 'r16', 'r14',
];

// r14 — єдиний png серед скріншотів.
const PNG = new Set(['r14']);

export const REVIEWS = FILES.map(
  (name) => `images/reviews/${name}${PNG.has(name) ? '.png' : '.jpg'}`,
);
