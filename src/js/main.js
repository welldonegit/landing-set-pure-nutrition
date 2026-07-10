// <image-slot> — плейсхолдер під лабораторний документ.
// Реєструє власний кастомний елемент; поза середовищем авторингу — read-only.
import '../../image-slot.js';

import { initBreedSwitcher } from './features/breed-switcher.js';
import { initProductModal } from './features/product-modal.js';
import { initReviewsSlider } from './features/reviews-slider.js';
import { initReviewsGallery } from './features/reviews-gallery.js';
import { initCountdown } from './features/countdown.js';
import { initUpsell } from './features/upsell.js';
import { initPaymentMethod } from './features/payment-method.js';
import { initCalculator } from './features/calculator.js';
import { initPriceTable } from './features/price-table.js';
import { initOrderForm } from './form/order-form.js';
import { initStickyCta } from './features/sticky-cta.js';
import { captureUtm } from './utils/utm.js';

// До будь-якого рендеру: людина може прийти з реклами й піти на іншу сторінку,
// а заявку залишити пізніше — мітки мають пережити цей шлях.
captureUtm();

// Кожен init самостійно перевіряє наявність своєї розмітки і мовчки
// виходить, якщо її немає. Порядок викликів не має значення.
initBreedSwitcher();
initProductModal();
initReviewsSlider();
initReviewsGallery();
initCountdown();
initUpsell();
initPaymentMethod();
initCalculator();
initPriceTable();
initOrderForm();
initStickyCta();
