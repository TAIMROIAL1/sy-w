/* Card editor: 4 card types, live preview, cloze helper, image masks */
(() => {
  const page = document.getElementById('card-editor');
  if (!page) return;

  const groupId = page.dataset.groupId;
  const cardId = page.dataset.cardId;
  const existing = JSON.parse(page.dataset.card || 'null');

  const form = document.getElementById('card-form');
  const typeTabs = [...page.querySelectorAll('.type-tab')];
  const typeFields = [...page.querySelectorAll('.type-fields')];
  const frontInput = document.getElementById('front');
  const backInput = document.getElementById('back');
  const clozeInput = document.getElementById('cloze-text');
  const clozeCountEl = document.getElementById('cloze-count');
  const extraInput = document.getElementById('extra');
  const saveBtn = document.getElementById('save-btn');
  const saveNewBtn = document.getElementById('save-new-btn');
  const preview = document.getElementById('preview');
  const flipBtn = document.getElementById('flip-preview');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('image-input');
  const maskEditor = document.getElementById('mask-editor');
  const stage = document.getElementById('mask-stage');
  const stageImg = document.getElementById('mask-image');
  const maskCountEl = document.getElementById('mask-count');

  const MAX_FILE = 5 * 1024 * 1024;
  const MAX_WIDTH = 1400;
  const MIN_MASK = 1.5; // % of the image

  let type = existing ? existing.type : 'basic';
  let image = existing && existing.image ? existing.image : ''; // url shown in the editor
  let imageFile = null; // new picture to upload (Blob), null = keep the saved one
  let masks = existing && existing.masks ? existing.masks.map(({ x, y, w, h }) => ({ x, y, w, h })) : [];
  let revealed = false;

  /* ------------------------------ type ------------------------------ */
  const setType = function (newType) {
    type = newType;
    typeTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.type === type);
      t.setAttribute('aria-selected', t.dataset.type === type);
    });
    typeFields.forEach(f => f.hidden = !f.dataset.fields.split(' ').includes(type));
    page.querySelectorAll('[data-only]').forEach(el => el.hidden = el.dataset.only !== type);
    renderPreview();
  };

  typeTabs.forEach(t => t.addEventListener('click', () => !t.disabled && setType(t.dataset.type)));

  /* ----------------------------- preview ---------------------------- */
  const currentCard = () => ({
    type,
    front: frontInput.value.trim(),
    back: backInput.value.trim(),
    text: clozeInput.value.trim(),
    image,
    masks,
    extra: extraInput.value.trim()
  });

  const cardBox = (card, label, opts) =>
    `${label ? `<span class="preview-label">${label}</span>` : ''}<article class="study-card ${revealed ? 'is-revealed' : ''}">${Anki.renderCard(card, revealed, opts)}</article>`;

  const renderPreview = function () {
    const card = currentCard();

    if (type === 'reverse') {
      preview.innerHTML =
        cardBox(card, 'البطاقة 1: الوجه الأول ← الوجه الثاني', { badgeSuffix: ' · 1' }) +
        cardBox({ ...card, front: card.back, back: card.front }, 'البطاقة 2: الوجه الثاني ← الوجه الأول', { badgeSuffix: ' · 2' });
    } else {
      preview.innerHTML = cardBox(card);
    }

    clozeCountEl.textContent = Anki.clozeCount(clozeInput.value);
    flipBtn.querySelector('span').textContent = revealed ? 'إخفاء الإجابة' : 'إظهار الإجابة';
  };

  flipBtn.addEventListener('click', () => {
    revealed = !revealed;
    renderPreview();
  });

  [frontInput, backInput, clozeInput, extraInput].forEach(input => input.addEventListener('input', () => {
    input.classList.remove('invalid');
    renderPreview();
  }));

  /* ------------------------------ cloze ----------------------------- */
  document.getElementById('hide-selection').addEventListener('click', () => {
    const { selectionStart: start, selectionEnd: end, value } = clozeInput;
    const selected = value.slice(start, end);

    if (!selected.trim()) {
      Anki.toast('حدد الكلمات التي تريد إخفاءها أولاً', 'error');
      clozeInput.focus();
      return;
    }

    clozeInput.value = `${value.slice(0, start)}[$${selected}$]${value.slice(end)}`;
    clozeInput.focus();
    clozeInput.setSelectionRange(end + 4, end + 4);
    renderPreview();
  });

  /* ------------------------------ image ----------------------------- */
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const round = n => Math.round(n * 100) / 100;

  const renderMasks = function () {
    stage.querySelectorAll('.mask').forEach(m => m.remove());
    masks.forEach((m, i) => {
      const el = document.createElement('div');
      el.className = 'mask';
      el.style.cssText = `left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%`;
      el.textContent = i + 1;
      el.innerHTML += `<button type="button" class="mask-remove" data-index="${i}" aria-label="حذف المستطيل ${i + 1}"><i class="fa-solid fa-xmark"></i></button>`;
      stage.appendChild(el);
    });
    maskCountEl.textContent = masks.length ? `${masks.length} منطقة مخفية` : 'لم ترسم أي مستطيل بعد';
    renderPreview();
  };

  const showImage = function (src) {
    image = src;
    stageImg.src = src;
    dropzone.hidden = !!src;
    maskEditor.hidden = !src;
    renderMasks();
  };

  // downscale big photos so the upload stays small, returns a jpeg Blob
  const readImage = file => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('الملف المختار ليس صورة'));
    if (file.size > MAX_FILE) return reject(new Error('حجم الصورة يجب ألا يتجاوز 5MB'));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذرت قراءة الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذرت قراءة الصورة'));
      img.onload = () => {
        const scale = Math.min(1, MAX_WIDTH / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('تعذرت قراءة الصورة')), 'image/jpeg', 0.85);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  const blobToDataUrl = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('تعذرت قراءة الصورة'));
    reader.readAsDataURL(blob);
  });

  const handleFile = async function (file) {
    if (!file) return;
    try {
      const blob = await readImage(file);
      imageFile = blob;
      masks = [];
      showImage(await blobToDataUrl(blob)); // data: url for the preview (blob: urls are often blocked by CSP img-src)
    } catch (err) {
      Anki.toast(err.message, 'error');
    }
  };

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', () => { handleFile(fileInput.files[0]); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
  dropzone.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));

  document.getElementById('change-image').addEventListener('click', () => fileInput.click());
  document.getElementById('undo-mask').addEventListener('click', () => { masks.pop(); renderMasks(); });
  document.getElementById('clear-masks').addEventListener('click', () => { masks = []; renderMasks(); });

  // draw rectangles with mouse / finger / pen
  let drawing = null;

  const pointInStage = function (e) {
    const rect = stageImg.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width * 100, 0, 100),
      y: clamp((e.clientY - rect.top) / rect.height * 100, 0, 100)
    };
  };

  stage.addEventListener('pointerdown', e => {
    const remove = e.target.closest('.mask-remove');
    if (remove) {
      masks.splice(Number(remove.dataset.index), 1);
      renderMasks();
      return;
    }
    if (e.button !== 0 || !image) return;

    e.preventDefault();
    stage.setPointerCapture(e.pointerId);
    const start = pointInStage(e);
    const el = document.createElement('div');
    el.className = 'mask drawing';
    stage.appendChild(el);
    drawing = { start, el, rect: { x: start.x, y: start.y, w: 0, h: 0 } };
  });

  stage.addEventListener('pointermove', e => {
    if (!drawing) return;
    const p = pointInStage(e);
    const { start } = drawing;
    drawing.rect = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) };
    const r = drawing.rect;
    drawing.el.style.cssText = `left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%`;
  });

  const finishDrawing = function () {
    if (!drawing) return;
    const r = drawing.rect;
    drawing.el.remove();
    drawing = null;

    if (r.w < MIN_MASK || r.h < MIN_MASK) return; // ignore clicks / tiny boxes
    if (masks.length >= 30) return Anki.toast('لا يمكن إضافة أكثر من 30 مستطيلاً', 'error');

    masks.push({ x: round(r.x), y: round(r.y), w: round(r.w), h: round(r.h) });
    renderMasks();
  };

  stage.addEventListener('pointerup', finishDrawing);
  stage.addEventListener('pointercancel', finishDrawing);

  /* ------------------------------ save ------------------------------ */
  // client side check, the server validates again
  const validate = function (card) {
    const fail = (msg, input) => {
      Anki.toast(msg, 'error');
      if (input) { input.classList.add('invalid'); input.focus(); }
      return false;
    };

    if (type === 'basic' || type === 'reverse') {
      if (!card.front) return fail('الرجاء كتابة الوجه الأول (السؤال)', frontInput);
      if (!card.back) return fail('الرجاء كتابة الوجه الثاني (الإجابة)', backInput);
    }
    if (type === 'cloze') {
      if (!card.text) return fail('الرجاء كتابة نص البطاقة', clozeInput);
      if (!Anki.clozeCount(card.text)) return fail('أخفِ جزءاً واحداً على الأقل بكتابته بين [$ و $]', clozeInput);
    }
    if (type === 'image') {
      if (!card.image) return fail('الرجاء رفع صورة');
      if (!card.masks.length) return fail('ارسم مستطيلاً واحداً على الأقل لإخفاء جزء من الصورة');
    }
    return true;
  };

  const resetForm = function () {
    [frontInput, backInput, clozeInput, extraInput].forEach(i => i.value = '');
    masks = [];
    imageFile = null;
    showImage('');
    revealed = false;
    renderPreview();
    (type === 'cloze' ? clozeInput : type === 'image' ? dropzone : frontInput).focus();
  };

  const save = async function (addAnother) {
    const card = currentCard();
    if (!validate(card)) return;

    const body = { type, extra: card.extra };
    if (type === 'basic' || type === 'reverse') Object.assign(body, { front: card.front, back: card.back });
    if (type === 'cloze') body.text = card.text;
    let payload = body;
    if (type === 'image') {
      body.masks = card.masks;
      payload = new FormData();
      payload.append('data', JSON.stringify(body));
      if (imageFile) payload.append('image', imageFile, 'card.jpg');
    }

    [saveBtn, saveNewBtn].forEach(b => b && (b.disabled = true));
    try {
      const res = cardId
        ? await Anki.api(`/cards/${cardId}`, 'PATCH', payload)
        : await Anki.api(`/groups/${groupId}/cards`, 'POST', payload);

      if (addAnother) {
        Anki.toast(res.message);
        resetForm();
      } else {
        Anki.toastAfterReload(res.message);
        location.href = page.dataset.backUrl || `/anki/library/${groupId}?tab=edit`;
      }
    } catch (err) {
      Anki.toast(err.message, 'error');
    } finally {
      [saveBtn, saveNewBtn].forEach(b => b && (b.disabled = false));
    }
  };

  form.addEventListener('submit', e => { e.preventDefault(); save(false); });
  if (saveNewBtn) saveNewBtn.addEventListener('click', () => save(true));

  /* ------------------------------ init ------------------------------ */
  if (image) showImage(image);
  setType(type);
})();
