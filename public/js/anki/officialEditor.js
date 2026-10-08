/* Admin: create / edit an official group (photo → Bunny, topics, publish in المنهج, delete).
   The cards tab is handled by group.js */
(() => {
  const page = document.getElementById('official-editor');
  if (!page) return;

  const $ = id => document.getElementById(id);
  const groupId = page.dataset.groupId;
  const MAX_FILE = 5 * 1024 * 1024;
  const MAX_WIDTH = 1600;
  const MAX_TOPICS = 12;

  let photoFile = null;
  let topics = JSON.parse(page.dataset.topics || '[]');

  /* ------------------------------ photo ------------------------------ */
  // resized in the browser (max 1600px JPEG) before upload
  const resize = file => new Promise((resolve, reject) => {
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
        canvas.toBlob(blob => blob ? resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', 0.6) }) : reject(new Error('تعذرت قراءة الصورة')), 'image/jpeg', 0.85);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  const drop = $('photo-drop');
  const handleFile = async function (file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return Anki.toast('الرجاء رفع صورة PNG أو JPG أو WEBP أو GIF', 'error');
    try {
      const { blob, dataUrl } = await resize(file);
      if (blob.size > MAX_FILE) return Anki.toast('حجم الصورة يجب ألا يتجاوز 5MB', 'error');
      photoFile = blob;
      $('photo-preview').src = dataUrl;
      $('photo-preview').hidden = false;
      $('photo-empty').hidden = true;
      $('photo-change').hidden = false;
      drop.classList.add('has-photo');
      drop.classList.remove('invalid');
    } catch (err) {
      Anki.toast(err.message, 'error');
    }
  };

  $('photo-input').addEventListener('change', e => { handleFile(e.target.files[0]); e.target.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('dragover'); }));
  drop.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));

  /* ------------------------------ topics ----------------------------- */
  const chips = $('topic-chips');
  const topicInput = $('topic-input');

  const renderTopics = function () {
    chips.innerHTML = topics.map((t, i) =>
      `<li class="topic-chip"><span>${Anki.escapeHtml(t)}</span><button type="button" data-i="${i}" aria-label="حذف الموضوع"><i class="fa-solid fa-xmark"></i></button></li>`).join('');
    chips.hidden = !topics.length;
  };

  const addTopic = function () {
    const value = topicInput.value.trim();
    if (!value) return topicInput.focus();
    if (topics.includes(value)) return Anki.toast('هذا الموضوع موجود بالفعل', 'error');
    if (topics.length >= MAX_TOPICS) return Anki.toast(`لا يمكن إضافة أكثر من ${MAX_TOPICS} موضوعاً`, 'error');
    topics.push(value);
    topicInput.value = '';
    topicInput.focus();
    renderTopics();
  };

  $('topic-add').addEventListener('click', addTopic);
  topicInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } });
  chips.addEventListener('click', e => {
    const btn = e.target.closest('button[data-i]');
    if (!btn) return;
    topics.splice(Number(btn.dataset.i), 1);
    renderTopics();
  });
  renderTopics();

  /* ------------------------------- save ------------------------------ */
  const form = $('official-form');
  const saveBtn = $('of-save');
  const required = [['of-name', 'الرجاء ادخال اسم المجموعة'], ['of-description', 'الرجاء كتابة وصف للمجموعة']];

  form.addEventListener('input', e => e.target.classList.remove('invalid'));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    for (const [id, message] of required) {
      if ($(id).value.trim()) continue;
      $(id).classList.add('invalid');
      $(id).focus();
      return Anki.toast(message, 'error');
    }
    if (!groupId && !photoFile) {
      drop.classList.add('invalid');
      drop.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return Anki.toast('الرجاء رفع صورة للمجموعة', 'error');
    }

    const body = {
      name: $('of-name').value.trim(),
      subject: $('of-subject').value.trim(),
      level: $('of-level').value.trim(),
      description: $('of-description').value.trim(),
      topics,
      published: $('of-published') ? $('of-published').checked : false
    };
    const payload = new FormData();
    payload.append('data', JSON.stringify(body));
    if (photoFile) payload.append('image', photoFile, 'photo.jpg');

    saveBtn.disabled = true;
    try {
      const res = groupId
        ? await Anki.api(`/official/${groupId}`, 'PATCH', payload)
        : await Anki.api('/official', 'POST', payload);
      Anki.toastAfterReload(res.message);
      location.href = groupId ? `/anki/official/${groupId}` : `/anki/official/${res.data.group._id}/edit?tab=edit`;
    } catch (err) {
      Anki.toast(err.message, 'error');
      saveBtn.disabled = false;
    }
  });

  /* ------------------------------ delete ----------------------------- */
  const deleteBtn = $('of-delete');
  if (deleteBtn) deleteBtn.addEventListener('click', async () => {
    let deleted;
    await Anki.confirm({
      title: 'حذف المجموعة؟',
      text: 'سيتم حذف المجموعة وكل بطاقاتها وتقدم الطلاب فيها. لا يمكن التراجع عن هذا الإجراء.',
      icon: 'fa-trash',
      danger: true,
      submitText: 'حذف',
      onSubmit: async () => { deleted = await Anki.api(`/groups/${groupId}`, 'DELETE'); }
    });
    if (!deleted) return;
    Anki.toastAfterReload(deleted.message);
    location.href = '/anki/curriculum';
  });
})();
