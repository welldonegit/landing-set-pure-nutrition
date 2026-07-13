import { CERTIFICATES } from '../data/certificates.js';
import { qs } from '../utils/dom.js';
import { createLightbox } from './lightbox.js';

/** Клік по зображенню сертифіката або по лупі відкриває галерею з першого. */
export function initCertificates(root = document) {
  const trigger = qs('cert-open', root);
  const lightbox = createLightbox(root);
  if (!trigger || !lightbox) return;

  // Один обробник на контейнері: клік по лупі спливає сюди, тож галерея
  // відкривається рівно раз і по зображенню, і по кнопці.
  trigger.addEventListener('click', () => lightbox.open(CERTIFICATES, 0));
}
