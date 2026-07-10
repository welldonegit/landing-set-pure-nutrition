import { maskAfterInput } from '../../../shared/phone.js';

const DELETE_TYPES = ['deleteContentBackward', 'deleteContentForward'];

const isDeletion = (event) =>
  typeof event?.inputType === 'string' &&
  DELETE_TYPES.includes(event.inputType);

/**
 * Маска вводу телефону: +38(0XX)-XXX-XXXX.
 *
 * Це лише зручність — на валідацію не впливає: validate.js перевіряє
 * нормалізовані цифри, тож вставлений або підставлений браузером текст
 * теж буде перевірено як слід.
 */
export function initPhoneMask(input) {
  if (!input) return;

  input.setAttribute('inputmode', 'tel');
  input.setAttribute('autocomplete', 'tel');

  let previousValue = input.value;

  const apply = (event) => {
    const next = maskAfterInput(input.value, {
      deleting: isDeletion(event),
      previousValue,
    });

    if (next !== input.value) {
      input.value = next;
      // Курсор завжди в кінці: маска переписує рядок цілком.
      input.setSelectionRange(next.length, next.length);
    }
    previousValue = next;
  };

  input.addEventListener('input', apply);
  input.addEventListener('blur', apply);
}
