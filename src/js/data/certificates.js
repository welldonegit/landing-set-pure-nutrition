/** Сертифікати якості для галереї. Порядок 1…6. */
const COUNT = 6;

export const CERTIFICATES = Array.from({ length: COUNT }, (_, i) => ({
  src: `images/quality-certificate${i + 1}.jpg`,
  alt: `Сертифікат якості Pure Nutrition ${i + 1}`,
}));
