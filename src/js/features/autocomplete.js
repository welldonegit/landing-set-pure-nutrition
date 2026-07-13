/**
 * Універсальний autocomplete: інпут + випадний список.
 *
 * Пошук стартує від 2 символів, з debounce і скасуванням попереднього
 * запиту через AbortController. Показує стани «завантаження / порожньо /
 * помилка». Вибір мишею й клавіатурою (стрілки, Enter, Esc). Після ручної
 * зміни тексту раніше обраний елемент скидається.
 */

const DEBOUNCE_MS = 300;

/**
 * @param {object} opts
 * @param {HTMLInputElement} opts.input
 * @param {HTMLElement} opts.list        контейнер випадного списку
 * @param {(query:string, signal:AbortSignal)=>Promise<Array>} opts.search
 * @param {(item:object)=>string} opts.render  текст пункту
 * @param {(item:object|null)=>void} opts.onSelect  item=null означає скидання вибору
 * @param {number} [opts.minChars=2]     від скількох символів починати пошук
 * @param {boolean} [opts.searchOnFocus] показувати список одразу при фокусі (порожній запит)
 * @returns {{ reset: ()=>void, setEnabled: (on:boolean)=>void }}
 */
export function createAutocomplete({
  input,
  list,
  search,
  render,
  onSelect,
  minChars = 2,
  searchOnFocus = false,
}) {
  let items = [];
  let active = -1;
  let timer = null;
  let controller = null;
  let selected = false;

  const close = () => {
    list.hidden = true;
    list.innerHTML = '';
    active = -1;
  };

  const setState = (html) => {
    list.innerHTML = html;
    list.hidden = false;
    active = -1;
  };

  const paint = () => {
    list.innerHTML = items
      .map(
        (item, i) =>
          `<li class="ac__item${i === active ? ' is-active' : ''}" role="option" data-i="${i}">${render(item)}</li>`,
      )
      .join('');
    list.hidden = items.length === 0;
  };

  const choose = (i) => {
    const item = items[i];
    if (!item) return;
    selected = true;
    input.value = render(item);
    onSelect(item);
    close();
  };

  const run = async (query) => {
    controller?.abort();
    controller = new AbortController();
    setState('<li class="ac__note">Завантаження…</li>');
    try {
      items = await search(query, controller.signal);
      if (items.length === 0) {
        setState('<li class="ac__note">Нічого не знайдено</li>');
        return;
      }
      paint();
    } catch (error) {
      if (error.name === 'AbortError') return; // новий запит скасував цей
      items = [];
      setState('<li class="ac__note ac__note--error">Помилка пошуку. Спробуйте ще раз.</li>');
    }
  };

  input.addEventListener('input', () => {
    // Будь-яка ручна зміна тексту скидає раніше обраний елемент.
    if (selected) {
      selected = false;
      onSelect(null);
    }
    clearTimeout(timer);
    const query = input.value.trim();
    // Порожній ввід при searchOnFocus — показуємо перелік (напр. відділення міста).
    if (query.length < minChars && !(searchOnFocus && query.length === 0)) {
      controller?.abort();
      close();
      return;
    }
    timer = setTimeout(() => run(query), DEBOUNCE_MS);
  });

  if (searchOnFocus) {
    input.addEventListener('focus', () => {
      if (input.disabled || selected) return;
      if (input.value.trim().length < minChars) run('');
    });
  }

  input.addEventListener('keydown', (e) => {
    if (list.hidden || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = (active + 1) % items.length;
      paint();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active - 1 + items.length) % items.length;
      paint();
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        choose(active);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  list.addEventListener('mousedown', (e) => {
    // mousedown, а не click: спрацьовує до blur інпута.
    const li = e.target.closest('[data-i]');
    if (li) choose(Number(li.dataset.i));
  });

  input.addEventListener('blur', () => setTimeout(close, 120));

  return {
    reset() {
      clearTimeout(timer);
      controller?.abort();
      selected = false;
      input.value = '';
      close();
    },
    setEnabled(on) {
      input.disabled = !on;
      if (!on) close();
    },
  };
}
