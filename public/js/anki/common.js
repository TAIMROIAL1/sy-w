/* Shared helpers for every Anki page: API calls, toasts, dialogs, card rendering, dark mode */
const Anki = (() => {
  const domain = document.body.dataset.domain || '';
  const API = `${domain}/api/v1/anki`;
  const CLOZE_REGEX = /\[\$([\s\S]+?)\$\]/g;

  const TYPES = {
    basic: { label: 'بسيطة', icon: 'fa-clone' },
    reverse: { label: 'عكسية', icon: 'fa-right-left' },
    cloze: { label: 'فراغات', icon: 'fa-i-cursor' },
    image: { label: 'صورة', icon: 'fa-image' }
  };

  const escapeHtml = str => String(str == null ? '' : str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ------------------------------ api ------------------------------ */
  // returns the json body, throws Error(message) when status is not success. body: object (json) or FormData (file upload)
  const api = async function (path, method = 'GET', body) {
    const isForm = body instanceof FormData;
    let res;
    try {
      res = await fetch(`${API}${path}`, {
        method,
        headers: body && !isForm ? { 'Content-Type': 'application/json' } : {},
        body: isForm ? body : body ? JSON.stringify(body) : undefined
      });
    } catch (err) {
      throw new Error('تعذر الاتصال بالخادم، تحقق من الإنترنت');
    }

    let data = {};
    try { data = await res.json(); } catch (err) { /* empty body */ }

    if (!res.ok || data.status !== 'success') throw new Error(data.message || 'حدث خطأ, الرجاء المحاولة مجددا');
    return data;
  };

  /* ----------------------------- toast ----------------------------- */
  const toastWrap = document.getElementById('toast-wrap');
  const toast = function (msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type === 'success' ? '' : 'error'}`;
    el.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i><span></span>`;
    el.querySelector('span').textContent = msg;
    // keep at most 2 toasts on screen
    [...toastWrap.children].slice(0, -1).forEach(old => old.remove());
    toastWrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 300);
    }, 3500);
  };

  // keep a message across a page reload
  const toastAfterReload = (msg, type = 'success') => sessionStorage.setItem('ankiToast', JSON.stringify({ msg, type }));
  const pending = sessionStorage.getItem('ankiToast');
  if (pending) {
    sessionStorage.removeItem('ankiToast');
    const { msg, type } = JSON.parse(pending);
    toast(msg, type);
  }

  /* ----------------------------- dialog ---------------------------- */
  const modal = document.getElementById('anki-modal');
  const modalForm = document.getElementById('anki-modal-form');
  const modalIcon = document.getElementById('anki-modal-icon');
  const modalTitle = document.getElementById('anki-modal-title');
  const modalText = document.getElementById('anki-modal-text');
  const modalFields = document.getElementById('anki-modal-fields');
  const modalSubmit = document.getElementById('anki-modal-submit');
  let closeModal = null;

  // fields: [{ name, label, type: 'text' | 'textarea' | 'select', value, options, required, maxlength, placeholder }]
  // resolves with { name: value } (or true when there are no fields) / null when cancelled
  const dialog = function ({ title, text = '', icon = 'fa-layer-group', danger = false, submitText = 'حفظ', fields = [], onSubmit }) {
    if (closeModal) closeModal(null);

    modalTitle.textContent = title;
    modalText.textContent = text;
    modalText.hidden = !text;
    modalIcon.className = `modal-icon ${danger ? 'danger' : ''}`;
    modalIcon.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    modalSubmit.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    modalSubmit.textContent = submitText;
    modalSubmit.disabled = false;

    modalFields.innerHTML = '';
    fields.forEach((f, i) => {
      const id = `modal-field-${i}`;
      const wrap = document.createElement('div');
      wrap.innerHTML = `<label class="field-label" for="${id}"></label>`;
      wrap.querySelector('label').textContent = f.label;
      const input = document.createElement(f.type === 'textarea' ? 'textarea' : f.type === 'select' ? 'select' : 'input');
      input.id = id;
      input.name = f.name;
      input.className = 'input';
      // select: options [{ value, label }]
      (f.type === 'select' ? f.options || [] : []).forEach(o => {
        const option = document.createElement('option');
        option.value = o.value;
        option.textContent = o.label;
        input.appendChild(option);
      });
      if (f.type !== 'select' || f.value) input.value = f.value || '';
      if (f.type === 'textarea') input.rows = 3;
      if (f.maxlength) input.maxLength = f.maxlength;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.required) input.required = true;
      wrap.appendChild(input);
      modalFields.appendChild(wrap);
    });
    modalFields.hidden = !fields.length;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const firstInput = modalFields.querySelector('.input');
    (firstInput || modalSubmit).focus();
    if (firstInput && firstInput.select && firstInput.tagName !== 'SELECT') firstInput.select();

    return new Promise(resolve => {
      const cleanup = value => {
        modal.hidden = true;
        document.body.style.overflow = '';
        modalForm.onsubmit = null;
        closeModal = null;
        resolve(value);
      };
      closeModal = cleanup;

      modalForm.onsubmit = async e => {
        e.preventDefault();
        const values = {};
        let valid = true;
        modalFields.querySelectorAll('.input').forEach(input => {
          values[input.name] = input.value.trim();
          const bad = input.required && !values[input.name];
          input.classList.toggle('invalid', bad);
          if (bad && valid) { input.focus(); valid = false; }
        });
        if (!valid) return;

        const result = fields.length ? values : true;
        if (!onSubmit) return cleanup(result);

        // keep the dialog open while the request runs, close only on success
        modalSubmit.disabled = true;
        try {
          await onSubmit(result);
          cleanup(result);
        } catch (err) {
          toast(err.message, 'error');
          modalSubmit.disabled = false;
        }
      };
    });
  };

  modal.addEventListener('click', e => {
    if (e.target.closest('[data-close]') && closeModal) closeModal(null);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && closeModal) closeModal(null);
  });

  const confirm = opts => dialog({ icon: 'fa-triangle-exclamation', submitText: 'تأكيد', ...opts });

  /* -------------------------- card rendering ------------------------ */
  const renderCloze = function (text, revealed) {
    return escapeHtml(text).replace(CLOZE_REGEX, (m, answer) =>
      `<span class="cloze-blank ${revealed ? 'revealed' : ''}" data-answer="${answer}">${revealed ? answer : '[...]'}</span>`);
  };

  const clozeCount = text => [...String(text || '').matchAll(CLOZE_REGEX)].filter(m => m[1].trim()).length;

  const typeBadge = (type, suffix = '') =>
    `<span class="type-badge ${type}"><i class="fa-solid ${TYPES[type].icon}"></i> ${TYPES[type].label}${suffix}</span>`;

  // inner html of a .study-card (used by the study page and the editor preview)
  const renderCard = function (card, revealed, { badge = true, badgeSuffix = '' } = {}) {
    let html = badge ? typeBadge(card.type, badgeSuffix) : '';

    if (card.type === 'cloze') {
      html += card.text
        ? `<div class="face-q cloze-text">${renderCloze(card.text, revealed)}</div>`
        : '<p class="face-empty">اكتب نص البطاقة لتظهر المعاينة</p>';
    } else if (card.type === 'image') {
      html += card.image
        ? `<div class="image-card"><img src="${escapeHtml(card.image)}" alt="">${(card.masks || []).map(m =>
          `<span class="mask ${revealed ? 'revealed' : ''}" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%"></span>`).join('')}</div>`
        : '<p class="face-empty">ارفع صورة لتظهر المعاينة</p>';
    } else {
      html += card.front
        ? `<div class="face-q">${escapeHtml(card.front)}</div>`
        : '<p class="face-empty">اكتب السؤال لتظهر المعاينة</p>';
      if (revealed) html += `<div class="face-divider"></div><div class="face-a">${escapeHtml(card.back || '…')}</div>`;
    }

    if (revealed && card.extra) html += `<div class="face-extra"><i class="fa-solid fa-lightbulb"></i><span>${escapeHtml(card.extra)}</span></div>`;
    return html;
  };

  // clicking a hidden blank / mask reveals only that part
  document.addEventListener('click', e => {
    const blank = e.target.closest('.study-card .cloze-blank:not(.revealed)');
    if (blank) {
      blank.classList.add('revealed');
      blank.textContent = blank.dataset.answer;
    }
    const mask = e.target.closest('.study-card .image-card .mask:not(.revealed)');
    if (mask) mask.classList.add('revealed');

    // every hidden part opened -> tell the study page (it shows the answer)
    const card = (blank || mask) && (blank || mask).closest('.study-card');
    if (card && !card.querySelector('.cloze-blank:not(.revealed), .image-card .mask:not(.revealed)'))
      card.dispatchEvent(new CustomEvent('anki:all-parts-revealed', { bubbles: true }));
  });

  /* ---------------------------- dark mode --------------------------- */
  const darkToggle = document.getElementById('dark-toggle');
  if (darkToggle) {
    darkToggle.checked = document.body.classList.contains('page-dark-mode');
    darkToggle.addEventListener('change', () => {
      document.body.classList.toggle('page-dark-mode', darkToggle.checked);
      if (darkToggle.checked) localStorage.setItem('darkMode', 'active');
      else localStorage.removeItem('darkMode');
    });
  }

  /* ----------------------------- search ----------------------------- */
  // filters items by their data-search attribute
  const bindSearch = function (input, items, noResults) {
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      items().forEach(item => {
        const match = !q || (item.dataset.search || '').toLowerCase().includes(q);
        item.hidden = !match;
        if (match) shown++;
      });
      if (noResults) noResults.hidden = shown > 0;
    });
  };

  return { api, toast, toastAfterReload, dialog, confirm, renderCard, renderCloze, clozeCount, typeBadge, escapeHtml, bindSearch, TYPES };
})();
