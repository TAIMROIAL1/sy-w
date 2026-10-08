/* Library group page: tabs, edit name/description, delete cards, publish flow */
(() => {
  // also used by the admin official group editor (tabs + card list)
  const page = document.getElementById('library-group') || document.getElementById('official-editor');
  if (!page || !page.dataset.groupId) return;

  const groupId = page.dataset.groupId;
  const tabs = [...page.querySelectorAll('.tab')];
  const panels = [...page.querySelectorAll('[data-panel]')];

  /* ------------------------------ tabs ------------------------------ */
  const showTab = function (name) {
    tabs.forEach(t => {
      t.classList.toggle('active', t.dataset.tab === name);
      t.setAttribute('aria-selected', t.dataset.tab === name);
    });
    panels.forEach(p => p.hidden = p.dataset.panel !== name);
    const url = new URL(location.href);
    url.searchParams.set('tab', name);
    history.replaceState(null, '', url);
  };

  tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
  page.querySelectorAll('.go-edit-btn').forEach(b => b.addEventListener('click', () => showTab('edit')));

  /* ---------------------- edit name / description -------------------- */
  const editGroupBtn = page.querySelector('.edit-group-btn');
  if (editGroupBtn) editGroupBtn.addEventListener('click', async () => {
    let edited;
    await Anki.dialog({
      title: 'تعديل المجموعة',
      icon: 'fa-pen',
      fields: [
        { name: 'name', label: 'اسم المجموعة', value: page.dataset.name, required: true, maxlength: 80 },
        { name: 'description', label: 'الوصف', type: 'textarea', value: page.dataset.description, placeholder: 'ماذا تحتوي هذه المجموعة؟' }
      ],
      onSubmit: async values => { edited = await Anki.api(`/groups/${groupId}`, 'PATCH', values); }
    });
    if (!edited) return;

    // the publish checklist depends on the description, simplest is to re-render
    Anki.toastAfterReload(edited.message);
    location.reload();
  });

  /* ---------------------------- cards ------------------------------- */
  const list = document.getElementById('card-list');
  const tabCount = page.querySelector('.tab[data-tab="edit"] .count');

  Anki.bindSearch(document.getElementById('card-search'), () => [...list.querySelectorAll('.card-item')], page.querySelector('[data-panel="edit"] .no-results'));

  list.addEventListener('click', async e => {
    if (!e.target.closest('.delete-card-btn')) return;
    const item = e.target.closest('.card-item');
    const isReverse = item.dataset.type === 'reverse';

    let deleted;
    await Anki.confirm({
      title: 'حذف البطاقة؟',
      text: isReverse ? 'هذه بطاقة عكسية، سيتم حذف البطاقتين معاً.' : 'لا يمكن التراجع عن هذا الإجراء.',
      icon: 'fa-trash',
      danger: true,
      submitText: 'حذف',
      onSubmit: async () => { deleted = await Anki.api(`/cards/${item.dataset.cardId}`, 'DELETE'); }
    });
    if (!deleted) return;

    item.classList.add('removing');
    setTimeout(() => {
      item.remove();
      const items = [...list.querySelectorAll('.card-item')];
      items.forEach((it, i) => it.querySelector('.card-index').textContent = i + 1);
      tabCount.textContent = items.length;
      list.hidden = !items.length;
      page.querySelector('.cards-empty').hidden = !!items.length;
    }, 300);
    Anki.toast(deleted.message);
  });

  /* ---------------------------- publish ----------------------------- */
  const publishBtn = page.querySelector('[data-panel="publish"] .publish-btn');
  if (publishBtn) publishBtn.addEventListener('click', async () => {
    let res;
    await Anki.confirm({
      title: 'إرسال المجموعة للمراجعة؟',
      text: 'سيراجع المشرفون البطاقات، وبعد الموافقة ستظهر المجموعة في المجتمع.',
      icon: 'fa-paper-plane',
      submitText: 'إرسال',
      onSubmit: async () => { res = await Anki.api(`/groups/${groupId}/publish`, 'POST'); }
    });
    if (!res) return;
    Anki.toastAfterReload(res.message);
    location.reload();
  });

  const unpublishBtn = page.querySelector('.unpublish-btn');
  if (unpublishBtn) unpublishBtn.addEventListener('click', async () => {
    let res;
    await Anki.confirm({
      title: unpublishBtn.dataset.confirm,
      icon: 'fa-eye-slash',
      danger: true,
      submitText: 'تأكيد',
      onSubmit: async () => { res = await Anki.api(`/groups/${groupId}/publish`, 'DELETE'); }
    });
    if (!res) return;
    Anki.toastAfterReload(res.message);
    location.reload();
  });
})();
