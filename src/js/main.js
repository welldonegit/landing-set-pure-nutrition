// <image-slot> — плейсхолдер під лабораторний документ.
// Реєструє власний кастомний елемент; поза середовищем авторингу — read-only.
import '../../image-slot.js';

import { initBreedSwitcher } from './features/breed-switcher.js';
import { initProductModal } from './features/product-modal.js';
import { initReviewsSlider } from './features/reviews-slider.js';
import { initReviewsGallery } from './features/reviews-gallery.js';
import { initCountdown } from './features/countdown.js';
import { initOrderSummary } from './features/order-summary.js';
import { initCalculator } from './features/calculator.js';
import { initPriceTable } from './features/price-table.js';

initBreedSwitcher();
initProductModal();
initReviewsSlider();
initReviewsGallery();
initCountdown();
initOrderSummary();
initCalculator();
initPriceTable();
