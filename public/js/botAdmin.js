// Bot control panel (/bot-admin): talks to /api/v1/bot (controllers/botController.js)
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if(v === undefined || v === null || v === false) return;
      if(k === 'class') node.className = v;
      else if(k === 'text') node.textContent = v;
      else if(k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    children.flat().forEach(c => c !== null && c !== undefined && c !== false && node.append(c));
    return node;
  };
  const icon = cls => el('i', { class: cls, 'aria-hidden': 'true' });

  const KIND = {
    text: { label: 'نص', icon: 'fa-solid fa-font' },
    photo: { label: 'صورة', icon: 'fa-solid fa-image', accept: 'image/*' },
    video: { label: 'فيديو', icon: 'fa-solid fa-video', accept: 'video/*' },
    document: { label: 'ملف', icon: 'fa-solid fa-file-lines', accept: '' }
  };
  const TYPE = {
    menu: { label: 'قائمة', icon: 'fa-solid fa-folder-open' },
    content: { label: 'محتوى', icon: 'fa-solid fa-message' },
    question: { label: 'سؤال', icon: 'fa-solid fa-circle-question' }
  };

  // ---------- helpers ----------
  const cleanMessage = msg => String(msg || '').replace(/^Validation Error:\s*/, '');

  async function api(path, { method = 'GET', body, form } = {}) {
    const res = await fetch(`/api/v1/bot${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: form || (body ? JSON.stringify(body) : undefined)
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if(res.status === 429) throw new Error('طلبات كثيرة، انتظر ثوانٍ وحاول مجدداً');
    if(!res.ok || data.status === 'fail' || data.status === 'error') throw new Error(cleanMessage(data.message) || 'حدث خطأ، حاول مرة أخرى');
    return data;
  }

  function toast(message, type = 'success') {
    const node = el('div', { class: `toast ${type}` }, icon(type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'), el('span', { text: message }));
    $('#toast-wrap').append(node);
    setTimeout(() => node.remove(), 3800);
  }
  const showError = err => toast(err.message || 'حدث خطأ', 'error');

  async function busy(button, fn) {
    if(button) button.disabled = true;
    try { return await fn(); } catch (err) { showError(err); } finally { if(button) button.disabled = false; }
  }

  const formatDate = d => d ? new Date(d).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const timeAgo = d => {
    if(!d) return '—';
    const min = Math.floor((Date.now() - new Date(d)) / 60000);
    if(min < 1) return 'الآن';
    if(min < 60) return `منذ ${min} دقيقة`;
    if(min < 1440) return `منذ ${Math.floor(min / 60)} ساعة`;
    if(min < 43200) return `منذ ${Math.floor(min / 1440)} يوم`;
    return formatDate(d);
  };

  function confirmDialog(title, text, okLabel = 'تأكيد', danger = true) {
    const modal = $('#confirm-modal');
    $('#confirm-title').textContent = title;
    $('#confirm-text').textContent = text;
    const ok = $('#confirm-ok');
    ok.textContent = okLabel;
    ok.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    modal.showModal();
    return new Promise(resolve => {
      const done = value => { modal.close(); cleanup(); resolve(value); };
      const onSubmit = e => { e.preventDefault(); done(true); };
      const onCancel = () => done(false);
      const closers = $$('[data-close]', modal);
      const cleanup = () => {
        $('#confirm-form').removeEventListener('submit', onSubmit);
        modal.removeEventListener('cancel', onCancel);
        closers.forEach(c => c.removeEventListener('click', onCancel));
      };
      $('#confirm-form').addEventListener('submit', onSubmit);
      modal.addEventListener('cancel', onCancel);
      closers.forEach(c => c.addEventListener('click', onCancel));
    });
  }

  $$('dialog.modal').forEach(modal => {
    if(modal.id === 'confirm-modal') return;
    $$('[data-close]', modal).forEach(btn => btn.addEventListener('click', () => modal.close()));
  });

  // ---------- items editor (used by buttons and posts) ----------
  function itemsEditor(container) {
    const rows = () => $$('.item', container);

    function refreshArrows() {
      const all = rows();
      all.forEach((row, i) => {
        $('[data-act=up]', row).disabled = i === 0;
        $('[data-act=down]', row).disabled = i === all.length - 1;
      });
    }

    function add(item) {
      const kind = KIND[item.kind];
      const row = el('div', { class: 'item' });
      row.dataset.kind = item.kind;
      row.dataset.fileId = item.file_id || '';
      row.dataset.fileName = item.file_name || '';

      const head = el('div', { class: 'item-head' },
        el('span', { class: 'kind' }, icon(kind.icon), el('span', { text: kind.label })),
        el('button', { class: 'icon-btn', type: 'button', 'data-act': 'up', title: 'للأعلى', 'aria-label': 'للأعلى' }, icon('fa-solid fa-arrow-up')),
        el('button', { class: 'icon-btn', type: 'button', 'data-act': 'down', title: 'للأسفل', 'aria-label': 'للأسفل' }, icon('fa-solid fa-arrow-down')),
        el('button', { class: 'icon-btn danger', type: 'button', 'data-act': 'remove', title: 'حذف', 'aria-label': 'حذف' }, icon('fa-solid fa-trash'))
      );
      const body = el('div', { class: 'item-body' });

      if(item.kind === 'text') {
        body.append(el('textarea', { rows: 4, maxlength: 4096, placeholder: 'اكتب الرسالة...', 'data-field': 'text' }));
        $('textarea', body).value = item.text || '';
      } else {
        const input = el('input', { type: 'file', accept: kind.accept || undefined });
        const status = el('span', { class: `upload-status${item.file_id ? ' ok' : ''}`, text: item.file_id ? `✓ ${item.file_name || 'ملف مرفوع'}` : 'لم يتم اختيار ملف' });
        const pick = el('button', { class: 'btn btn-soft', type: 'button', onclick: () => input.click() }, icon('fa-solid fa-upload'), el('span', { text: item.file_id ? 'تغيير' : 'اختر ملف' }));
        input.addEventListener('change', async () => {
          const file = input.files[0];
          if(!file) return;
          const form = new FormData();
          form.append('kind', item.kind);
          form.append('file', file);
          status.className = 'upload-status';
          status.textContent = `جاري الرفع... ${file.name}`;
          row.dataset.uploading = '1';
          pick.disabled = true;
          try {
            const { data } = await api('/upload', { method: 'POST', form });
            row.dataset.fileId = data.file_id;
            row.dataset.fileName = data.file_name || file.name;
            status.className = 'upload-status ok';
            status.textContent = `✓ ${row.dataset.fileName}`;
            $('span', pick).textContent = 'تغيير';
          } catch (err) {
            status.className = 'upload-status err';
            status.textContent = err.message;
          } finally {
            delete row.dataset.uploading;
            pick.disabled = false;
            input.value = '';
          }
        });
        body.append(el('div', { class: 'upload-box' }, pick, status, input));
        body.append(el('textarea', { rows: 2, maxlength: 1024, placeholder: 'وصف تحت الملف (اختياري)', 'data-field': 'caption' }));
        $('textarea', body).value = item.caption || '';
      }

      head.addEventListener('click', e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if(act === 'up' && row.previousElementSibling) container.insertBefore(row, row.previousElementSibling);
        if(act === 'down' && row.nextElementSibling) container.insertBefore(row.nextElementSibling, row);
        if(act === 'remove') row.remove();
        refreshArrows();
      });

      row.append(head, body);
      container.append(row);
      refreshArrows();
      $('textarea', row)?.focus();
    }

    return {
      add,
      set(items) { container.innerHTML = ''; (items || []).forEach(add); },
      uploading: () => rows().some(r => r.dataset.uploading),
      get: () => rows().map(row => row.dataset.kind === 'text'
        ? { kind: 'text', text: $('[data-field=text]', row).value }
        : { kind: row.dataset.kind, file_id: row.dataset.fileId, file_name: row.dataset.fileName, caption: $('[data-field=caption]', row).value })
    };
  }

  const editors = {
    'post-items': itemsEditor($('#post-items')),
    'button-items': itemsEditor($('#button-items'))
  };
  $$('.add-items').forEach(box => box.addEventListener('click', e => {
    const kind = e.target.closest('[data-add]')?.dataset.add;
    if(kind) editors[box.dataset.for].add({ kind });
  }));

  // ---------- overview ----------
  const state = { settings: {}, buttons: [], menuId: null, previewMenuId: null };

  async function loadOverview() {
    try {
      const { data } = await api('/overview');
      state.settings = data.settings;
      $('#stat-subscribers').textContent = data.subscribers;
      $('#stat-questions').textContent = data.openQuestions;
      const badge = $('#questions-badge');
      badge.textContent = data.openQuestions;
      badge.classList.toggle('hidden', !data.openQuestions);
      $('#send-post').dataset.count = data.subscribers;
      const alerts = [];
      if(!data.tokenSet) alerts.push('لم يتم ضبط BOT_TOKEN على السيرفر: رفع الملفات والمنشورات والردود لن تعمل.');
      if(!data.settings.seeded && !data.buttons) alerts.push('لم يتم تشغيل النسخة الجديدة من البوت بعد: عند تشغيلها ستُنسخ الأزرار الحالية تلقائياً.');
      $('#config-alert-text').textContent = alerts.join(' ');
      $('#config-alert').classList.toggle('hidden', !alerts.length);
      return data;
    } catch (err) {
      $('#config-alert-text').textContent = `تعذر الاتصال بقاعدة بيانات البوت: ${err.message}`;
      $('#config-alert').classList.remove('hidden');
      throw err;
    }
  }

  // ---------- tabs ----------
  const loaded = {};
  const tabLoaders = {
    menus: () => loadButtons(),
    posts: () => loadPosts(),
    questions: () => loadQuestions(),
    subscribers: () => Promise.all([loadSubscribers(), loadMonthly()]),
    settings: () => fillSettings()
  };
  function openTab(name) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    $$('.panel').forEach(p => p.classList.toggle('hidden', p.id !== `tab-${name}`));
    if(name !== 'posts') stopPolling();
    if(!loaded[name] || name === 'posts' || name === 'questions') {
      loaded[name] = true;
      Promise.resolve(tabLoaders[name]()).catch(showError);
    }
    history.replaceState(null, '', `#${name}`);
  }
  $$('.tab').forEach(tab => tab.addEventListener('click', () => openTab(tab.dataset.tab)));

  // ---------- menus ----------
  const byId = id => state.buttons.find(b => b._id === id);
  const childrenOf = id => state.buttons.filter(b => (b.parent || null) === (id || null)).sort((a, b) => a.order - b.order);
  const pathTo = id => {
    const path = [];
    for(let b = byId(id); b; b = byId(b.parent)) path.unshift(b);
    return path;
  };
  const menuInfo = id => {
    const menu = id ? byId(id) : null;
    return {
      menu,
      label: menu ? menu.label : 'الصفحة الرئيسية',
      message: menu ? (menu.message || '') : (state.settings.main_message || ''),
      columns: (menu ? menu.columns : state.settings.main_columns) || 2
    };
  };

  async function loadButtons() {
    const { data } = await api('/buttons');
    state.buttons = data.buttons;
    if(state.menuId && !byId(state.menuId)) state.menuId = null;
    renderMenu();
  }

  function renderMenu() {
    const info = menuInfo(state.menuId);
    $('#menu-title').textContent = info.label;
    $('#menu-message').value = info.message;
    $('#menu-columns').value = String(info.columns);

    const crumbs = $('#crumbs');
    crumbs.innerHTML = '';
    const path = [{ _id: null, label: 'الصفحة الرئيسية' }, ...pathTo(state.menuId)];
    path.forEach((b, i) => {
      if(i) crumbs.append(el('span', { class: 'sep' }, icon('fa-solid fa-chevron-left')));
      const isCurrent = i === path.length - 1;
      crumbs.append(el('button', { type: 'button', class: isCurrent ? 'current' : '', text: b.label, onclick: () => !isCurrent && openMenu(b._id) }));
    });

    const list = $('#button-list');
    list.innerHTML = '';
    const children = childrenOf(state.menuId);
    $('#buttons-empty').classList.toggle('hidden', children.length > 0);

    children.forEach((b, i) => {
      const count = b.type === 'menu' ? childrenOf(b._id).length : b.items.length;
      const meta = b.type === 'menu' ? `قائمة · ${count} زر` : b.type === 'content' ? `محتوى · ${count} رسالة` : 'يستقبل سؤال الطالب';
      const title = el('b', { text: b.label });
      const infoNode = b.type === 'menu'
        ? el('button', { type: 'button', class: 'open-menu', title: 'فتح القائمة', onclick: () => openMenu(b._id) }, title, el('small', { text: meta }))
        : el('div', {}, title, el('small', { text: meta }));
      if(b.hidden) $('small', infoNode).append(el('span', { class: 'pill', text: 'مخفي' }));

      const action = (cls, title, onclick, disabled) => el('button', { type: 'button', class: `icon-btn${cls.includes('trash') ? ' danger' : ''}`, title, 'aria-label': title, onclick, disabled }, icon(cls));
      list.append(el('li', { class: `button-row${b.hidden ? ' is-hidden' : ''}` },
        el('span', { class: `type-icon ${b.type}` }, icon(TYPE[b.type].icon)),
        el('div', { class: 'button-info' }, infoNode),
        el('div', { class: 'button-actions' },
          b.type === 'menu' ? action('fa-solid fa-folder-open', 'فتح', () => openMenu(b._id)) : null,
          action('fa-solid fa-pen', 'تعديل', () => openButtonModal(b)),
          action('fa-solid fa-arrow-up', 'للأعلى', () => moveInList(i, -1), i === 0),
          action('fa-solid fa-arrow-down', 'للأسفل', () => moveInList(i, 1), i === children.length - 1),
          action(b.hidden ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash', b.hidden ? 'إظهار' : 'إخفاء', e => toggleHidden(b, e.currentTarget)),
          action('fa-solid fa-right-left', 'نقل إلى قائمة أخرى', () => openMoveModal(b)),
          action('fa-solid fa-trash', 'حذف', () => deleteButton(b))
        )
      ));
    });

    state.previewMenuId = state.menuId;
    renderPreview([{ text: info.message || info.label }]);
  }

  function openMenu(id) {
    state.menuId = id || null;
    renderMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function moveInList(index, delta) {
    const children = childrenOf(state.menuId);
    const [moved] = children.splice(index, 1);
    children.splice(index + delta, 0, moved);
    children.forEach((b, order) => { b.order = order; });
    renderMenu();
    try {
      await api('/buttons/reorder', { method: 'POST', body: { parent: state.menuId, ids: children.map(b => b._id) } });
    } catch (err) {
      showError(err);
      loadButtons().catch(showError);
    }
  }

  function toggleHidden(b, button) {
    busy(button, async () => {
      const { data } = await api(`/buttons/${b._id}`, { method: 'PATCH', body: { hidden: !b.hidden } });
      Object.assign(b, data.button);
      renderMenu();
      toast(b.hidden ? 'تم إخفاء الزر' : 'الزر ظاهر الآن');
    });
  }

  async function deleteButton(b) {
    const inside = b.type === 'menu' ? state.buttons.filter(x => pathTo(x._id).some(p => p._id === b._id)).length - 1 : 0;
    const ok = await confirmDialog('حذف الزر', inside > 0 ? `سيتم حذف «${b.label}» وكل ما بداخلها (${inside} زر). لا يمكن التراجع.` : `سيتم حذف «${b.label}». لا يمكن التراجع.`, 'حذف');
    if(!ok) return;
    busy(null, async () => {
      const { message } = await api(`/buttons/${b._id}`, { method: 'DELETE' });
      toast(message);
      await loadButtons();
    });
  }

  $('#save-menu').addEventListener('click', e => busy(e.currentTarget, async () => {
    const message = $('#menu-message').value;
    const columns = Number($('#menu-columns').value);
    if(state.menuId) {
      const { data } = await api(`/buttons/${state.menuId}`, { method: 'PATCH', body: { message, columns } });
      Object.assign(byId(state.menuId), data.button);
    } else {
      if(!message.trim()) throw new Error('اكتب رسالة الصفحة الرئيسية');
      const { data } = await api('/settings', { method: 'PATCH', body: { main_message: message, main_columns: columns } });
      state.settings = data.settings;
    }
    renderMenu();
    toast('تم حفظ القائمة');
  }));

  // preview: a small Telegram chat that follows the buttons pressed
  function renderPreview(messages, meText) {
    const chat = $('#preview-chat');
    chat.innerHTML = '';
    if(meText) chat.append(el('div', { class: 'bubble me', text: meText }));
    messages.forEach(m => {
      if(m.kind && m.kind !== 'text') {
        chat.append(el('div', { class: 'bubble media' }, icon(KIND[m.kind].icon), el('div', {}, el('span', { text: KIND[m.kind].label }), el('small', { text: m.file_name || '' }), m.caption ? el('small', { text: m.caption }) : null)));
      } else chat.append(el('div', { class: 'bubble', text: m.text || '' }));
    });
    chat.scrollTop = chat.scrollHeight;

    const keyboard = $('#preview-keyboard');
    keyboard.innerHTML = '';
    const info = menuInfo(state.previewMenuId);
    const visible = childrenOf(state.previewMenuId).filter(b => !b.hidden);
    for(let i = 0; i < visible.length; i += info.columns) {
      keyboard.append(el('div', { class: 'kb-row' }, visible.slice(i, i + info.columns).map(b => el('button', { type: 'button', class: 'kb-btn', text: b.label, title: b.label, onclick: () => pressPreview(b) }))));
    }
    if(state.previewMenuId) {
      keyboard.append(el('div', { class: 'kb-row' }, el('button', { type: 'button', class: 'kb-btn', text: state.settings.back_label || '🔙 العودة الى الخلف', onclick: () => {
        const parent = byId(state.previewMenuId)?.parent || null;
        const label = state.settings.back_label || '🔙 العودة الى الخلف';
        state.previewMenuId = parent;
        renderPreview([{ text: parent ? byId(parent).label : (state.settings.main_message || 'الصفحة الرئيسية') }], label);
      } })));
    }
  }

  function pressPreview(b) {
    if(b.type === 'menu') {
      state.previewMenuId = b._id;
      renderPreview([{ text: b.message || b.label }], b.label);
    } else if(b.type === 'question') {
      renderPreview([{ text: b.message || 'أرسل لنا سؤالك برسالة واحدة فقط..' }], b.label);
    } else {
      renderPreview(b.items, b.label);
    }
  }

  // button editor
  let editing = null; // button being edited, null = new
  const modal = $('#button-modal');
  const selectedType = () => $('input[name=button-type]:checked')?.value;
  const showTypeFields = () => $$('.type-fields', modal).forEach(f => f.classList.toggle('hidden', f.dataset.type !== selectedType()));
  $$('input[name=button-type]').forEach(r => r.addEventListener('change', () => {
    showTypeFields();
    if(selectedType() === 'content' && !$$('.item', $('#button-items')).length) editors['button-items'].add({ kind: 'text' });
  }));

  function openButtonModal(b) {
    editing = b || null;
    $('#button-modal-title').textContent = b ? `تعديل «${b.label}»` : `زر جديد في «${menuInfo(state.menuId).label}»`;
    $('#button-label').value = b ? b.label : '';
    const type = b ? b.type : 'content';
    $(`input[name=button-type][value=${type}]`).checked = true;
    $('#button-menu-message').value = b && b.type === 'menu' ? b.message : '';
    $('#button-columns').value = String((b && b.columns) || 2);
    $('#button-question-message').value = b && b.type === 'question' ? b.message : '';
    $('#button-hidden').checked = !!(b && b.hidden);
    editors['button-items'].set(b && b.type === 'content' ? b.items : [{ kind: 'text' }]);
    showTypeFields();
    modal.showModal();
    $('#button-label').focus();
  }
  $('#add-button').addEventListener('click', () => openButtonModal(null));

  $('#button-form').addEventListener('submit', e => {
    e.preventDefault();
    const type = selectedType();
    if(editors['button-items'].uploading()) return toast('انتظر حتى ينتهي رفع الملف', 'error');
    const body = {
      label: $('#button-label').value,
      type,
      hidden: $('#button-hidden').checked,
      message: type === 'menu' ? $('#button-menu-message').value : type === 'question' ? $('#button-question-message').value : '',
      columns: Number($('#button-columns').value),
      items: type === 'content' ? editors['button-items'].get() : []
    };
    if(!body.label.trim()) return toast('اكتب اسم الزر', 'error');
    busy($('#button-save'), async () => {
      const res = editing
        ? await api(`/buttons/${editing._id}`, { method: 'PATCH', body })
        : await api('/buttons', { method: 'POST', body: { ...body, parent: state.menuId } });
      modal.close();
      toast(res.message);
      await loadButtons();
    });
  });

  // move to another menu
  let moving = null;
  function openMoveModal(b) {
    moving = b;
    const select = $('#move-target');
    select.innerHTML = '';
    const inside = id => pathTo(id).some(p => p._id === b._id);
    const add = (id, label, depth) => select.append(el('option', { value: id || '', text: `${'— '.repeat(depth)}${label}`, disabled: (b.parent || null) === (id || null) || undefined }));
    add(null, 'الصفحة الرئيسية', 0);
    const walk = (parent, depth) => childrenOf(parent).filter(x => x.type === 'menu' && !inside(x._id)).forEach(m => { add(m._id, m.label, depth); walk(m._id, depth + 1); });
    walk(null, 1);
    const firstFree = $$('option', select).find(o => !o.disabled);
    if(firstFree) select.value = firstFree.value;
    $('#move-modal').showModal();
  }
  $('#move-form').addEventListener('submit', e => {
    e.preventDefault();
    const parent = $('#move-target').value || null;
    busy($('#move-form button[type=submit]'), async () => {
      const { message } = await api(`/buttons/${moving._id}/move`, { method: 'POST', body: { parent } });
      $('#move-modal').close();
      toast(message);
      await loadButtons();
    });
  });

  // ---------- posts ----------
  let pollTimer = null;
  const stopPolling = () => { clearTimeout(pollTimer); pollTimer = null; };

  const postBody = () => ({
    items: editors['post-items'].get(),
    link_text: $('#post-link-text').value,
    link_url: $('#post-link-url').value
  });
  const checkPost = body => {
    if(editors['post-items'].uploading()) throw new Error('انتظر حتى ينتهي رفع الملف');
    if(!body.items.length) throw new Error('أضف نصاً أو صورة أو ملفاً للمنشور');
  };

  $('#preview-post').addEventListener('click', e => busy(e.currentTarget, async () => {
    const body = postBody();
    checkPost(body);
    toast((await api('/posts/preview', { method: 'POST', body })).message);
  }));

  $('#send-post').addEventListener('click', async e => {
    const button = e.currentTarget;
    const body = postBody();
    try { checkPost(body); } catch (err) { return showError(err); }
    const count = button.dataset.count || 0;
    if(!(await confirmDialog('إرسال المنشور', `سيصل المنشور إلى ${count} مشترك. لا يمكن التراجع بعد الإرسال.`, 'إرسال', false))) return;
    busy(button, async () => {
      const { message } = await api('/posts', { method: 'POST', body });
      toast(message);
      editors['post-items'].set([{ kind: 'text' }]);
      $('#post-link-text').value = '';
      $('#post-link-url').value = '';
      await loadPosts();
    });
  });

  function renderPosts(posts) {
    const list = $('#post-list');
    list.innerHTML = '';
    $('#posts-empty').classList.toggle('hidden', posts.length > 0);
    posts.forEach(p => {
      const firstText = p.items.find(i => i.kind === 'text');
      const media = p.items.filter(i => i.kind !== 'text');
      const stale = p.status === 'sending' && Date.now() - new Date(p.updated_at) > 5 * 60 * 1000;
      const status = stale ? ['failed', 'توقف'] : p.status === 'sending' ? ['sending', 'قيد الإرسال'] : p.status === 'done' ? ['done', 'تم الإرسال'] : ['failed', 'فشل'];
      const done = p.sent + p.failed + p.blocked;
      const pct = p.total ? Math.round((done / p.total) * 100) : (p.status === 'done' ? 100 : 0);
      list.append(el('article', { class: 'post' },
        el('div', { class: 'post-top' },
          el('span', { text: `${formatDate(p.created_at)}${p.created_by ? ` · ${p.created_by}` : ''}` }),
          el('span', { class: `status ${status[0]}`, text: status[1] })),
        firstText ? el('div', { class: 'post-text', text: firstText.text }) : null,
        media.length ? el('div', { class: 'post-media' }, media.map(m => el('span', { class: 'pill' }, icon(KIND[m.kind].icon), ` ${m.file_name || KIND[m.kind].label}`))) : null,
        p.link_text ? el('div', { class: 'post-media' }, el('span', { class: 'pill' }, icon('fa-solid fa-link'), ` ${p.link_text}`)) : null,
        el('div', { class: 'progress' }, el('span', { style: `width:${pct}%` })),
        el('div', { class: 'post-counts' },
          el('span', { text: `${done} / ${p.total}` }),
          el('span', { class: 'ok', text: `وصل: ${p.sent}` }),
          p.blocked ? el('span', { class: 'warn', text: `أوقفوا البوت: ${p.blocked}` }) : null,
          p.failed ? el('span', { class: 'bad', text: `فشل: ${p.failed}` }) : null)
      ));
    });
    return posts.some(p => p.status === 'sending' && Date.now() - new Date(p.updated_at) < 5 * 60 * 1000);
  }

  async function loadPosts() {
    stopPolling();
    const { data } = await api('/posts');
    if(renderPosts(data.posts)) pollTimer = setTimeout(() => loadPosts().catch(showError), 2500);
    else loadOverview().catch(() => {});
  }

  // ---------- questions ----------
  let questionStatus = 'open';
  $$('#question-filters .chip').forEach(chip => chip.addEventListener('click', () => {
    questionStatus = chip.dataset.status;
    $$('#question-filters .chip').forEach(c => c.classList.toggle('active', c === chip));
    loadQuestions().catch(showError);
  }));

  async function loadQuestions() {
    const { data } = await api(`/questions?status=${questionStatus}`);
    const list = $('#question-list');
    list.innerHTML = '';
    $('#questions-empty').classList.toggle('hidden', data.questions.length > 0);
    data.questions.forEach(q => {
      const name = q.first_name || 'طالب';
      const card = el('article', { class: 'question' },
        el('div', { class: 'question-top' },
          el('span', { class: 'avatar', text: name.trim().charAt(0) || '؟' }),
          el('div', {}, el('b', { text: name }), el('small', { text: `${q.username ? `@${q.username} · ` : ''}${timeAgo(q.created_at)}` })),
          el('button', { type: 'button', class: 'icon-btn danger', title: 'حذف', 'aria-label': 'حذف', onclick: async () => {
            if(!(await confirmDialog('حذف السؤال', 'سيتم حذف السؤال من القائمة فقط.', 'حذف'))) return;
            busy(null, async () => { toast((await api(`/questions/${q._id}`, { method: 'DELETE' })).message); await loadQuestions(); loadOverview().catch(() => {}); });
          } }, icon('fa-solid fa-trash'))),
        el('div', { class: 'question-text', text: q.text }));

      if(q.answered) {
        card.append(el('div', { class: 'answer-text' }, el('b', { text: `تم الرد ${q.answered_at ? timeAgo(q.answered_at) : ''}` }), q.answer || ''));
      } else {
        const area = el('textarea', { rows: 3, maxlength: 3500, placeholder: 'اكتب الرد...' });
        const send = el('button', { type: 'button', class: 'btn btn-primary' }, icon('fa-solid fa-reply'), el('span', { text: 'إرسال الرد' }));
        send.addEventListener('click', () => {
          if(!area.value.trim()) return toast('اكتب الرد أولاً', 'error');
          busy(send, async () => {
            toast((await api(`/questions/${q._id}/answer`, { method: 'POST', body: { answer: area.value } })).message);
            await loadQuestions();
            loadOverview().catch(() => {});
          });
        });
        card.append(area, el('div', { class: 'question-actions' }, el('span'), send));
      }
      list.append(card);
    });
  }

  // ---------- subscribers ----------
  const subs = { page: 1, pages: 1, q: '' };
  async function loadSubscribers() {
    const { data } = await api(`/subscribers?page=${subs.page}&q=${encodeURIComponent(subs.q)}`);
    subs.pages = data.pages;
    $('#subscribers-total').textContent = `(${data.total})`;
    $('#subscribers-page').textContent = `${data.page} / ${data.pages}`;
    $('#subscribers-prev').disabled = data.page <= 1;
    $('#subscribers-next').disabled = data.page >= data.pages;
    const body = $('#subscribers-body');
    body.innerHTML = '';
    if(!data.subscribers.length) body.append(el('tr', {}, el('td', { colspan: 6, class: 'muted', text: 'لا يوجد مشتركون' })));
    data.subscribers.forEach(s => body.append(el('tr', {},
      el('td', { text: [s.first_name, s.last_name].filter(Boolean).join(' ') || '—' }),
      el('td', { class: 'ltr', text: s.username ? `@${s.username}` : '—' }),
      el('td', { class: 'ltr', text: s.chat_id }),
      el('td', { text: formatDate(s.started_at) }),
      el('td', { text: timeAgo(s.last_seen) }),
      el('td', {}, s.blocked ? el('span', { class: 'badge-bad', text: 'أوقف البوت' }) : el('span', { class: 'badge-ok', text: 'نشط' }))
    )));
  }
  async function loadMonthly() {
    const { data } = await api('/stats/monthly');
    const body = $('#monthly-body');
    body.innerHTML = '';
    if(!data.months.length) body.append(el('tr', {}, el('td', { colspan: 4, class: 'muted', text: 'لا توجد بيانات شهرية بعد' })));
    data.months.forEach(m => body.append(el('tr', {},
      el('td', { class: 'ltr', text: m.month }),
      el('td', { text: m.active }),
      el('td', { text: m.new }),
      el('td', { text: m.blocked })
    )));
  }
  let searchTimer;
  $('#subscriber-search').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { subs.q = e.target.value.trim(); subs.page = 1; loadSubscribers().catch(showError); }, 400);
  });
  $('#subscribers-prev').addEventListener('click', () => { if(subs.page > 1) { subs.page--; loadSubscribers().catch(showError); } });
  $('#subscribers-next').addEventListener('click', () => { if(subs.page < subs.pages) { subs.page++; loadSubscribers().catch(showError); } });

  // ---------- settings ----------
  const settingsForm = $('#settings-form');
  function fillSettings() {
    $$('[name]', settingsForm).forEach(input => { input.value = state.settings[input.name] ?? ''; });
  }
  settingsForm.addEventListener('submit', e => {
    e.preventDefault();
    const body = {};
    $$('[name]', settingsForm).forEach(input => { body[input.name] = input.value; });
    busy($('button[type=submit]', settingsForm), async () => {
      const { data, message } = await api('/settings', { method: 'PATCH', body });
      state.settings = data.settings;
      fillSettings();
      renderMenu();
      toast(message);
    });
  });

  // ---------- start ----------
  editors['post-items'].set([{ kind: 'text' }]);
  loadOverview().then(() => {
    const first = (location.hash || '#menus').slice(1);
    openTab(tabLoaders[first] ? first : 'menus');
    if(first !== 'menus') { loaded.menus = true; loadButtons().catch(showError); }
  }).catch(() => {});
})();
