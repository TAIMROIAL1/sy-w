/* Library group page: tabs, edit name/description, inner groups, cards (select / move / order / delete), publish flow */
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

  /* -------------------------- inner groups -------------------------- */
  // a group holds cards or inner groups: creating the first inner group moves the cards into it
  page.querySelectorAll('.create-subgroup-btn').forEach(btn => btn.addEventListener('click', async () => {
    const cardsCount = Number(btn.dataset.cards || 0);
    let created;
    await Anki.dialog({
      title: 'مجموعة داخلية جديدة',
      text: cardsCount ? `ستنتقل كل البطاقات الحالية (${cardsCount}) إلى المجموعة الجديدة، ويمكنك بعدها نقلها إلى مجموعات داخلية أخرى.` : '',
      icon: 'fa-folder-plus',
      submitText: 'إنشاء',
      fields: [
        { name: 'name', label: 'اسم المجموعة', required: true, maxlength: 80, placeholder: 'مثال: الدرس الأول' },
        { name: 'description', label: 'الوصف (اختياري)', type: 'textarea', placeholder: 'ماذا تحتوي هذه المجموعة؟' }
      ],
      onSubmit: async values => { created = await Anki.api('/groups', 'POST', { ...values, parent: groupId }); }
    });
    if (!created) return;

    // stay on this group so the other inner groups can be added
    Anki.toastAfterReload(created.message);
    const url = new URL(location.href);
    url.searchParams.set('tab', 'edit');
    location.href = url.toString();
  }));

  const deleteGroupBtn = page.querySelector('.delete-group-btn');
  if (deleteGroupBtn) deleteGroupBtn.addEventListener('click', async () => {
    let deleted;
    await Anki.confirm({
      title: 'حذف المجموعة؟',
      text: 'سيتم حذف المجموعة وكل ما بداخلها من مجموعات وبطاقات. لا يمكن التراجع عن هذا الإجراء.',
      icon: 'fa-trash',
      danger: true,
      submitText: 'حذف',
      onSubmit: async () => { deleted = await Anki.api(`/groups/${groupId}`, 'DELETE'); }
    });
    if (!deleted) return;
    Anki.toastAfterReload(deleted.message);
    location.href = page.dataset.afterDelete;
  });

  /* ---------------------------- cards ------------------------------- */
  const list = document.getElementById('card-list');
  if (list) {
    const tabCount = page.querySelector('.tab[data-tab="edit"] .count');
    const selectionBar = document.getElementById('selection-bar');
    const selectAll = document.getElementById('select-all');
    const selectionCount = document.getElementById('selection-count');
    const moveBtn = document.getElementById('move-cards-btn');
    const targets = JSON.parse(list.dataset.moveTargets || '[]');

    const items = () => [...list.querySelectorAll('.card-item')];
    const selected = () => items().filter(it => it.querySelector('.card-select').checked);

    const updateSelection = function () {
      const all = items();
      const n = selected().length;
      selectionCount.textContent = n ? `${n} محددة` : '';
      moveBtn.disabled = !n;
      selectAll.checked = !!all.length && n === all.length;
      selectAll.indeterminate = n > 0 && n < all.length;
      all.forEach(it => it.classList.toggle('is-selected', it.querySelector('.card-select').checked));
    };

    const refresh = function () {
      const all = items();
      all.forEach((it, i) => it.querySelector('.card-index').textContent = i + 1);
      if (tabCount) tabCount.textContent = all.length;
      list.hidden = !all.length;
      selectionBar.hidden = !all.length;
      page.querySelector('.cards-empty').hidden = !!all.length;
      const subgroupBtn = page.querySelector('.panel-toolbar .create-subgroup-btn');
      if (subgroupBtn) subgroupBtn.dataset.cards = all.length;
      updateSelection();
    };

    Anki.bindSearch(document.getElementById('card-search'), items, page.querySelector('[data-panel="edit"] .no-results'));

    list.addEventListener('change', e => { if (e.target.classList.contains('card-select')) updateSelection(); });
    selectAll.addEventListener('change', () => {
      items().filter(it => !it.hidden).forEach(it => it.querySelector('.card-select').checked = selectAll.checked);
      updateSelection();
    });

    // order: saved a moment after the last up / down click
    let saveTimer;
    const saveOrder = function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          await Anki.api(`/groups/${groupId}/cards/order`, 'PATCH', { cardIds: items().map(it => it.dataset.cardId) });
        } catch (err) {
          Anki.toast(err.message, 'error');
        }
      }, 600);
    };

    list.addEventListener('click', async e => {
      const upBtn = e.target.closest('.move-up-btn');
      const downBtn = e.target.closest('.move-down-btn');
      if (upBtn || downBtn) {
        const item = e.target.closest('.card-item');
        const sibling = upBtn ? item.previousElementSibling : item.nextElementSibling;
        if (!sibling) return;
        if (upBtn) list.insertBefore(item, sibling);
        else list.insertBefore(sibling, item);
        (upBtn || downBtn).focus();
        refresh();
        saveOrder();
        return;
      }

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
      setTimeout(() => { item.remove(); refresh(); }, 300);
      Anki.toast(deleted.message);
    });

    moveBtn.addEventListener('click', async () => {
      const chosen = selected();
      if (!chosen.length) return;
      if (!targets.length) return Anki.toast('لا توجد مجموعة أخرى يمكن النقل إليها، أنشئ مجموعة أولاً', 'error');

      let moved;
      await Anki.dialog({
        title: chosen.length === 1 ? 'نقل البطاقة' : `نقل ${chosen.length} بطاقات`,
        text: 'اختر المجموعة التي ستنتقل إليها. البطاقة العكسية تنتقل مع نسختها المعكوسة.',
        icon: 'fa-right-left',
        submitText: 'نقل',
        fields: [{ name: 'groupId', label: 'المجموعة', type: 'select', required: true, options: targets.map(t => ({ value: t._id, label: t.path })) }],
        onSubmit: async values => { moved = await Anki.api('/cards/move', 'POST', { cardIds: chosen.map(it => it.dataset.cardId), groupId: values.groupId }); }
      });
      if (!moved) return;

      const ids = new Set(moved.data.moved.map(String));
      const gone = items().filter(it => ids.has(it.dataset.cardId));
      gone.forEach(it => it.classList.add('removing'));
      setTimeout(() => { gone.forEach(it => it.remove()); refresh(); }, 300);
      Anki.toast(moved.message);
    });

    refresh();
  }

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
