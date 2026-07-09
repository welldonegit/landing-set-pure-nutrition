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

// form/ поки не підключено — див. src/js/form/order-form.js (крок 4).
